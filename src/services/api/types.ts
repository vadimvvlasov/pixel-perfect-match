export type JobStatus = 'queued' | 'locating' | 'waiting_gpu' | 'running' | 'done' | 'failed' | 'no_scene';
export const FINISHED: readonly JobStatus[] = ['done', 'failed', 'no_scene'];
export interface Job { id: number; lon: number; lat: number; date: string; start_date: string; end_date: string; status: JobStatus; message: string | null; cell: string | null; scene_date: string | null; result_id: number | null; created_at: string }
export interface JobRequest { lon: number; lat: number; start: string; end: string }
export interface ResultMeta { id: number; cell: string; scene_date: string; model_version: string; cell_geom: GeoJSON.Polygon; n_fields: number | null }
export interface Me { email: string }
export type Bbox = [number, number, number, number];
