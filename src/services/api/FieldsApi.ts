import type * as GeoJSON from "geojson";
import type { Job, JobRequest, ResultMeta, Me, Bbox } from "./types";
export interface FieldsApi {
  me(): Promise<Me>;
  createJob(r: JobRequest): Promise<Job>;
  listJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job>;
  listResults(bbox: Bbox): Promise<ResultMeta[]>;
  getResult(id: number): Promise<ResultMeta>;
  getFields(id: number): Promise<GeoJSON.FeatureCollection>;
  downloadUrl(id: number): string;
}
