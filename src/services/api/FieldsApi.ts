import type { Bbox, Job, JobRequest, Me, ResultMeta } from "./types";

/**
 * Everything the UI asks of the backend. `HttpFieldsApi` talks to the Worker; a mock (plan step 1.3) will
 * implement the same interface so the UI runs without a backend. Methods reject with the errors of `errors.ts`.
 */
export interface FieldsApi {
  me(): Promise<Me>;
  createJob(request: JobRequest): Promise<Job>;
  /** The signed-in person's last 20 jobs, newest first. */
  listJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job>;
  /** Computed cells in the box: the dashed overview on the map. */
  listResults(bbox: Bbox): Promise<ResultMeta[]>;
  getResult(id: number): Promise<ResultMeta>;
  getFields(id: number): Promise<GeoJSON.FeatureCollection>;
  /** A link that downloads the result's GeoJSON. */
  downloadUrl(id: number): string;
}
