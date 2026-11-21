import { AuthRequiredError, NetworkError, NotFoundError, RateLimitError, ValidationError } from "../errors";
import type { FieldsApi } from "../FieldsApi";
import type { Bbox, Job, JobRequest, JobStatus, Me, ResultMeta } from "../types";

// The whole backend in the browser: `npm run dev` (VITE_API_MODE=mock) runs the UI with no Worker and no runner.
// Same rules as the Worker (validation, limits, someone else's job is 404) and a runner that takes a few seconds.
// Cells are 0.1 degree squares with a deterministic 8 x 8 layout of fields, like runner/fake_runner.py.

export type Scenario = "default" | "no-scene" | "flaky" | "auth" | "rate-limited";
export const SCENARIOS: readonly Scenario[] = ["default", "no-scene", "flaky", "auth", "rate-limited"];

export interface MockOptions {
  scenario?: Scenario;
  /** The clock the job timeline follows; tests pass their own. */
  now?: () => number;
  /** Delay of every call, to see loading states. */
  latencyMs?: number;
  email?: string;
}

/** When a job reaches each status, in ms after it was created (a real cell takes ~3 min). */
export const TIMELINE: readonly [number, JobStatus][] = [
  [1_000, "locating"],
  [3_000, "running"],
  [8_000, "done"],
];
export const MODEL_VERSION = "mock-v1";
const MAX_ACTIVE = 3;
const FIRST_SCENE = "2017-01-01";
const MAX_INTERVAL_DAYS = 366;
const CELL_DEG = 0.1;
const GRID = 8;

interface StoredResult extends ResultMeta {
  fields: GeoJSON.FeatureCollection;
  createdBy: number; // the job that computed it; later jobs for the same cell and scene reuse it
}

interface StoredJob extends JobRequest {
  id: number;
  createdAt: number;
  requestedBy: string;
}

export class MockFieldsApi implements FieldsApi {
  private jobs: StoredJob[] = [];
  private results: StoredResult[] = [];
  private calls = 0;
  private readonly scenario: Scenario;
  private readonly now: () => number;
  private readonly latencyMs: number;
  private readonly email: string;

  constructor(o: MockOptions = {}) {
    this.scenario = o.scenario ?? "default";
    this.now = o.now ?? Date.now;
    this.latencyMs = o.latencyMs ?? 0;
    this.email = o.email ?? "demo@example.com";
  }

  /** Every call: latency, then the scenario's failures. */
  private async enter(): Promise<void> {
    this.calls++;
    if (this.latencyMs) await new Promise((r) => setTimeout(r, this.latencyMs));
    if (this.scenario === "auth") throw new AuthRequiredError("forbidden", 403);
    if (this.scenario === "flaky" && this.calls % 4 === 0) throw new NetworkError();
  }

  async me(): Promise<Me> {
    await this.enter();
    return { email: this.email };
  }

  async createJob(r: JobRequest): Promise<Job> {
    await this.enter();
    const { lon, lat, start, end } = r;
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) {
      throw new ValidationError("lon/lat out of range", 400);
    }
    const today = new Date(this.now()).toISOString().slice(0, 10);
    const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
    if (!isDate(start) || !isDate(end) || start < FIRST_SCENE || end > today) {
      throw new ValidationError(`start and end must be YYYY-MM-DD between ${FIRST_SCENE} and today`, 400);
    }
    if (start > end) throw new ValidationError("start must not be after end", 400);
    if (daysBetween(start, end) > MAX_INTERVAL_DAYS) throw new ValidationError(`the interval is at most ${MAX_INTERVAL_DAYS} days`, 400);
    const active = this.jobs.filter((j) => j.requestedBy === this.email && !isFinished(this.view(j).status)).length;
    if (this.scenario === "rate-limited" || active >= MAX_ACTIVE) {
      throw new RateLimitError(`at most ${MAX_ACTIVE} jobs in progress per user`, 429);
    }
    const job: StoredJob = { id: this.jobs.length + 1, lon, lat, start, end, createdAt: this.now(), requestedBy: this.email };
    this.jobs.push(job);
    return this.view(job);
  }

  async listJobs(): Promise<Job[]> {
    await this.enter();
    return this.jobs
      .filter((j) => j.requestedBy === this.email)
      .slice(-20)
      .reverse()
      .map((j) => this.view(j));
  }

  async getJob(id: number): Promise<Job> {
    await this.enter();
    const job = this.jobs.find((j) => j.id === id && j.requestedBy === this.email);
    if (!job) throw new NotFoundError("not found", 404);
    return this.view(job);
  }

  async listResults(bbox: Bbox): Promise<ResultMeta[]> {
    await this.enter();
    this.jobs.forEach((j) => this.view(j)); // finish due jobs
    const [minx, miny, maxx, maxy] = bbox;
    return this.results
      .filter((r) => {
        const ring = r.cell_geom.coordinates[0];
        const start = ring?.[0], end = ring?.[2];
        if (!start || !end) return false;
        const [x0, y0] = start, [x1, y1] = end;
        if (x0 === undefined || y0 === undefined || x1 === undefined || y1 === undefined) return false;
        return x0 <= maxx && x1 >= minx && y0 <= maxy && y1 >= miny;
      })
      .map(meta);
  }

  async getResult(id: number): Promise<ResultMeta> {
    await this.enter();
    const r = this.results.find((x) => x.id === id);
    if (!r) throw new NotFoundError("not found", 404);
    return meta(r);
  }

  async getFields(id: number): Promise<GeoJSON.FeatureCollection> {
    await this.enter();
    const r = this.results.find((x) => x.id === id);
    if (!r) throw new NotFoundError("not found", 404);
    return r.fields;
  }

  downloadUrl(id: number): string {
    const r = this.results.find((x) => x.id === id);
    return `data:application/geo+json,${encodeURIComponent(JSON.stringify(r?.fields ?? { type: "FeatureCollection", features: [] }))}`;
  }

  /** The job as the API shows it now: its status follows TIMELINE from its creation. */
  private view(j: StoredJob): Job {
    const age = this.now() - j.createdAt;
    let status: JobStatus = "queued";
    for (const [at, s] of TIMELINE) if (age >= at) status = s;
    const { cell, ring } = cellOf(j.lon, j.lat);
    const sceneDate = sceneFor(cell, j.start, j.end);
    const located = status !== "queued";
    const base: Job = {
      id: j.id,
      lon: j.lon,
      lat: j.lat,
      date: j.start,
      start_date: j.start,
      end_date: j.end,
      status,
      message: null,
      cell: located ? cell : null,
      scene_date: null,
      result_id: null,
      created_at: new Date(j.createdAt).toISOString(),
    };
    if (this.scenario === "no-scene" && located) return { ...base, status: "no_scene", message: "no clear scene within ±30 days" };
    if (status === "locating" || status === "running") return { ...base, scene_date: sceneDate, message: status === "locating" ? "scene found" : null };
    if (status !== "done") return base;
    let result = this.results.find((r) => r.cell === cell && r.scene_date === sceneDate);
    if (!result) {
      const features = fields(cell, ring);
      result = {
        id: this.results.length + 1,
        cell,
        scene_date: sceneDate,
        model_version: MODEL_VERSION,
        cell_geom: { type: "Polygon", coordinates: [ring] },
        n_fields: features.length,
        fields: { type: "FeatureCollection", features },
        createdBy: j.id,
      };
      this.results.push(result);
    }
    const message = result.createdBy === j.id ? `${result.n_fields} fields` : "already computed";
    return { ...base, scene_date: sceneDate, result_id: result.id, message };
  }
}

const isFinished = (s: JobStatus) => s === "done" || s === "failed" || s === "no_scene";

const meta = ({ id, cell, scene_date, model_version, cell_geom, n_fields }: ResultMeta): ResultMeta => ({
  id,
  cell,
  scene_date,
  model_version,
  cell_geom,
  n_fields,
});

/** The 0.1 degree square of a point: id and closed ring (counter-clockwise from the south-west corner). */
export function cellOf(lon: number, lat: number): { cell: string; ring: [number, number][] } {
  const x = Math.floor(lon / CELL_DEG);
  const y = Math.floor(lat / CELL_DEG);
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  const [x0, y0] = [r(x * CELL_DEG), r(y * CELL_DEG)];
  const [x1, y1] = [r(x0 + CELL_DEG), r(y0 + CELL_DEG)];
  return { cell: `MOCK_${x}_${y}`, ring: [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]] };
}

/**
 * The scene the mock's runner "finds", the same for the same cell and dates: for one date the clearest 0..4 days
 * before it, for an interval the clearest inside it.
 */
function sceneFor(cell: string, start: string, end: string): string {
  const d = new Date(`${start}T00:00:00Z`);
  const days = daysBetween(start, end);
  d.setUTCDate(d.getUTCDate() + (days === 0 ? -(hash(cell + start) % 5) : hash(cell + start + end) % (days + 1)));
  return d.toISOString().slice(0, 10);
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mulberry32: a small seeded PRNG, so a cell always gets the same fields. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function areaHa(ring: [number, number][]): number {
  const lat0 = (ring.reduce((s, p) => s + p[1], 0) / ring.length) * (Math.PI / 180);
  const m = 111_320;
  const pts = ring.map(([x, y]): [number, number] => [x * m * Math.cos(lat0), y * m]);
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (a && b) s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.round((Math.abs(s) / 2 / 10_000) * 100) / 100;
}

/** A GRID x GRID layout of rectangles with road gaps; some left empty (not a field). */
export function fields(cell: string, ring: [number, number][]): GeoJSON.Feature[] {
  const rnd = random(hash(cell));
  const start = ring[0], end = ring[2];
  if (!start || !end) return [];
  const [x0, y0] = start, [x1, y1] = end;
  const sx = (x1 - x0) / GRID;
  const sy = (y1 - y0) / GRID;
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  const out: GeoJSON.Feature[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      if (rnd() < 0.15) continue;
      const gap = 0.04 + rnd() * 0.06;
      const [ax, ay] = [r(x0 + (i + gap) * sx), r(y0 + (j + gap) * sy)];
      const [bx, by] = [r(x0 + (i + 1 - gap) * sx), r(y0 + (j + 1 - gap) * sy)];
      const poly: [number, number][] = [[ax, ay], [bx, ay], [bx, by], [ax, by], [ax, ay]];
      out.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [poly] }, properties: { id: out.length + 1, area_ha: areaHa(poly) } });
    }
  }
  return out;
}
