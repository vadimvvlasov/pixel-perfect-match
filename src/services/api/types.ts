// The API's data, as openapi.yaml (repository root) describes it. Only what the UI uses.

export type JobStatus = "queued" | "locating" | "waiting_gpu" | "running" | "done" | "failed" | "no_scene";

/** Statuses after which a job never changes. */
export const FINISHED: readonly JobStatus[] = ["done", "failed", "no_scene"];

export interface Job {
  id: number;
  lon: number;
  lat: number;
  date: string; // YYYY-MM-DD, = start_date (what the runner searches near until it understands intervals)
  start_date: string; // the interval asked for; one date: start_date = end_date
  end_date: string;
  status: JobStatus;
  message: string | null;
  cell: string | null;
  scene_date: string | null;
  result_id: number | null;
  created_at: string;
}

export interface JobRequest {
  lon: number;
  lat: number;
  /** YYYY-MM-DD, 2017-01-01 .. today, start <= end, at most 366 days; one date: start = end. */
  start: string;
  end: string;
}

export interface ResultMeta {
  id: number;
  cell: string;
  scene_date: string;
  model_version: string;
  cell_geom: GeoJSON.Polygon;
  n_fields: number | null;
}

export interface Me {
  email: string;
}

/** [minx, miny, maxx, maxy] in degrees. */
export type Bbox = [number, number, number, number];
