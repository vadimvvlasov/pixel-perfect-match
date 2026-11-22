// The API's data, as openapi.yaml (repository root) describes it. Only what the UI uses.
// v2 additions are optional: a v1 backend omits them.

export type JobStatus = "queued" | "locating" | "waiting_gpu" | "running" | "done" | "failed" | "no_scene";

/** Statuses after which a job never changes. */
export const FINISHED: readonly JobStatus[] = ["done", "failed", "no_scene"];

export type VariantId = "sen2sr-da" | "fieldsr" | "tci-da";

/** GET /api/variants: the catalog, with the runner's availability. */
export interface Variant {
  id: VariantId;
  title: string; // "SEN2SR → Delineate Anything" | "fieldsr" | "TCI → Delineate Anything"
  description: string; // one or two sentences, Russian
  quality_s: number; // S against the teacher on 13 US season cells
  minutes_warm: number; // one season cell, imagery already cached
  minutes_cold: number; // the same with the imagery downloaded first
  typical_images: number; // images per season: monthly composites or clear dates
  default: boolean;
  available: boolean; // false: the runner is offline or the variant's worker is down
  unavailable_reason: string | null;
}

export interface Job {
  id: number;
  lon: number;
  lat: number;
  date: string; // YYYY-MM-DD: the date asked for (one date), else = start_date
  start_date: string; // the interval searched; one date: date ± 15 days, cut to 2017-01-01 .. today
  end_date: string;
  variant?: VariantId; // absent on a v1 backend: "fieldsr"
  status: JobStatus;
  message: string | null; // the runner's stage text, e.g. "запуск воркеров", "расчёт"
  cell: string | null;
  scene_date: string | null;
  result_id: number | null;
  created_at: string;
}

/** An interval (2017-01-01 .. today, start <= end, at most 366 days), or one date that the backend widens. */
export type JobRequest = { lon: number; lat: number; variant?: VariantId } & ({ start: string; end: string } | { date: string });

export interface ResultMeta {
  id: number;
  cell: string;
  scene_date: string | null; // the one scene of a v1 result; null for a pipeline result (many dates, see RunLog)
  model_version: string; // the result version, e.g. "a3d3a5600f80"
  cell_geom: GeoJSON.Polygon;
  n_fields: number | null;
  variant?: VariantId;
  start_date?: string | null;
  end_date?: string | null;
  n_images?: number | null;
}

/** GET /api/results/:id/run: the pipeline's {cell}.json without the config and the traceback. */
export interface RunLog {
  cell: string;
  variant: VariantId;
  version: string;
  model: string;
  start: string;
  end: string;
  candidates: number; // scenes found in the interval
  n_images: number; // images the model saw (dates, or monthly composites)
  dates: { date: string; valid: number; cloud: number; items: string[] }[]; // the chosen dates; fractions 0..1
  selection: Record<string, string>; // why a candidate date was dropped: date -> reason, e.g. "cloud 1.000 >= 0.05"
  times_s: Partial<Record<RunStage, number>>; // seconds per stage
  n_fields: number | null;
  process_peak_rss_gb: number | null;
  status: "done" | "no_images" | "failed";
}

export type RunStage =
  | "search" | "select" | "download" | "cloud" | "images" | "enhance" | "encode" | "model"
  | "fuse" | "instances" | "postprocess" | "write";

export interface Me {
  email: string;
  role?: "owner" | "member" | "tester";
  expires_at?: string | null; // tester keys end
  max_active_jobs?: number;
  max_jobs_per_day?: number;
  jobs_today?: number;
}

export type DownloadFormat = "geojson" | "gpkg" | "parquet";

/** [minx, miny, maxx, maxy] in degrees. */
export type Bbox = [number, number, number, number];
