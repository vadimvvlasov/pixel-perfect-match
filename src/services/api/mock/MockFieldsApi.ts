import type * as GeoJSON from "geojson";
import type { FieldsApi } from "../FieldsApi";
import { FINISHED, type Job, type JobRequest, type ResultMeta, type Bbox } from "../types";
import {
  AuthRequiredError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../errors";
import { polygonBounds } from "@/lib/geometry";
import { validateDates } from "@/lib/field-utils";
import { ru } from "@/i18n/ru";
export class MockFieldsApi implements FieldsApi {
  private jobs: Job[] = [];
  private results: ResultMeta[] = [];
  private fields = new Map<number, GeoJSON.FeatureCollection>();
  private calls = 0;
  constructor(
    private clock: () => number = Date.now,
    public scenario = "default",
    private latency = 300,
    private storage?: Storage,
  ) {
    if (storage) {
      try {
        const raw = storage.getItem(`fields-mock-${scenario}`);
        if (raw) {
          const saved = JSON.parse(raw) as {
            jobs: Job[];
            results: ResultMeta[];
            fields: [number, GeoJSON.FeatureCollection][];
          };
          this.jobs = saved.jobs;
          this.results = saved.results;
          this.fields = new Map(saved.fields);
        }
      } catch {
        /* A broken mock snapshot starts a clean session. */
      }
    }
  }
  private save() {
    try {
      this.storage?.setItem(
        `fields-mock-${this.scenario}`,
        JSON.stringify({ jobs: this.jobs, results: this.results, fields: [...this.fields] }),
      );
    } catch {
      /* Mock still works when browser storage is disabled. */
    }
  }
  private async call() {
    if (this.latency) await new Promise((r) => setTimeout(r, this.latency));
    this.calls++;
    if (this.scenario === "auth") throw new AuthRequiredError();
    if (this.scenario === "flaky" && this.calls % 4 === 0) throw new NetworkError();
  }
  async me() {
    await this.call();
    return { email: "agronom@example.com" };
  }
  async createJob(r: JobRequest) {
    await this.call();
    const error = validateDates(r.start, r.end, new Date(this.clock()).toISOString().slice(0, 10));
    if (error)
      throw new ValidationError(
        error === ru.dateOrder
          ? "start must not be after end"
          : error === ru.dateLength
            ? "the interval is at most 366 days"
            : "start and end must be YYYY-MM-DD between 2017-01-01 and today",
      );
    if (
      !Number.isFinite(r.lon) ||
      !Number.isFinite(r.lat) ||
      Math.abs(r.lon) > 180 ||
      Math.abs(r.lat) > 90
    )
      throw new ValidationError("lon and lat must be in range");
    if (
      this.scenario === "rate-limited" ||
      this.jobs.filter((j) => !FINISHED.includes(this.refresh(j).status)).length >= 3
    )
      throw new RateLimitError("at most 3 jobs in progress per user");
    const j: Job = {
      id: this.jobs.length + 1,
      lon: r.lon,
      lat: r.lat,
      date: r.start,
      start_date: r.start,
      end_date: r.end,
      status: "queued",
      message: null,
      cell: null,
      scene_date: null,
      result_id: null,
      created_at: new Date(this.clock()).toISOString(),
    };
    this.jobs.unshift(j);
    this.save();
    return { ...j };
  }
  private refresh(j: Job) {
    const age = (this.clock() - Date.parse(j.created_at)) / 1000;
    if (age < 1) return j;
    const x = Math.floor(j.lon * 10),
      y = Math.floor(j.lat * 10);
    j.cell = `MOCK_${x}_${y}`;
    const offset = Math.abs(x + y) % 5;
    j.scene_date =
      j.start_date === j.end_date
        ? new Date(Date.parse(j.date) - offset * 86400000).toISOString().slice(0, 10)
        : new Date(
            Date.parse(j.start_date) +
              Math.min(offset, (Date.parse(j.end_date) - Date.parse(j.start_date)) / 86400000) *
                86400000,
          )
            .toISOString()
            .slice(0, 10);
    if (age < 3) {
      j.status = "locating";
      j.message = "scene found";
    } else if (age < 8) {
      j.status = "running";
      j.message = "scene found";
    } else if (this.scenario === "no-scene") {
      j.status = "no_scene";
      j.message = "no clear scene within ±30 days";
    } else if (j.status !== "done") {
      const existing = this.results.find((r) => r.cell === j.cell && r.scene_date === j.scene_date);
      const result = existing ?? this.makeResult(x, y, j.scene_date);
      j.status = "done";
      j.result_id = result.id;
      j.message = existing ? "already computed" : `${result.n_fields} fields`;
    }
    this.save();
    return j;
  }
  private makeResult(x: number, y: number, scene: string) {
    const rectangle = (a: number, b: number, w: number, h: number): GeoJSON.Polygon => ({
      type: "Polygon",
      coordinates: [
        [
          [a, b],
          [a + w, b],
          [a + w, b + h],
          [a, b + h],
          [a, b],
        ],
      ],
    });
    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    for (let i = 0; i < 8; i++)
      for (let k = 0; k < 8; k++) {
        if (Math.abs(x + y + i * 13 + k * 7) % 7 === 0) continue;
        const w = 0.0108,
          h = 0.0105;
        features.push({
          type: "Feature",
          id: features.length,
          properties: {
            area_ha: +(
              (w * h * 111320 * 111320 * Math.cos(((y / 10) * Math.PI) / 180)) /
              10000
            ).toFixed(1),
          },
          geometry: rectangle(x / 10 + i * 0.0125 + 0.0007, y / 10 + k * 0.0125 + 0.0008, w, h),
        });
      }
    const result: ResultMeta = {
      id: this.results.length + 1,
      cell: `MOCK_${x}_${y}`,
      scene_date: scene,
      model_version: "fieldnet-v1.2",
      cell_geom: rectangle(x / 10, y / 10, 0.1, 0.1),
      n_fields: features.length,
    };
    this.results.push(result);
    this.fields.set(result.id, { type: "FeatureCollection", features });
    return result;
  }
  async listJobs() {
    await this.call();
    return this.jobs.slice(0, 20).map((j) => ({ ...this.refresh(j) }));
  }
  async getJob(id: number) {
    await this.call();
    const j = this.jobs.find((j) => j.id === id);
    if (!j) throw new NotFoundError();
    return { ...this.refresh(j) };
  }
  async listResults(b: Bbox) {
    await this.call();
    return this.results.filter((r) => {
      const p = polygonBounds(r.cell_geom);
      return p !== null && p[2] >= b[0] && p[0] <= b[2] && p[3] >= b[1] && p[1] <= b[3];
    });
  }
  async getResult(id: number) {
    await this.call();
    const r = this.results.find((r) => r.id === id);
    if (!r) throw new NotFoundError();
    return r;
  }
  async getFields(id: number) {
    await this.call();
    const f = this.fields.get(id);
    if (!f) throw new NotFoundError();
    return f;
  }
  downloadUrl(id: number) {
    const f = this.fields.get(id);
    return `data:application/geo+json;charset=utf-8,${encodeURIComponent(JSON.stringify(f ?? { type: "FeatureCollection", features: [] }))}`;
  }
}
