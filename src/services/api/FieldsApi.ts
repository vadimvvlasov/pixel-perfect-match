import type { Bbox, DownloadFormat, Job, JobRequest, Me, ResultMeta, RunLog, Variant, VariantId } from "./types";

/**
 * Everything the UI asks of the backend. `HttpFieldsApi` talks to the Worker; `MockFieldsApi` implements the same
 * interface so the UI runs without a backend. Methods reject with the errors of `errors.ts`.
 * Optional methods: the backend gets them next; the UI checks for them (and their flag) before use.
 */
export interface FieldsApi {
  me(): Promise<Me>;
  createJob(request: JobRequest): Promise<Job>;
  /** The signed-in person's last 20 jobs, newest first. */
  listJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job>;
  /** Computed cells in the box: the dashed overview on the map; optionally of one variant. */
  listResults(bbox: Bbox, variant?: VariantId): Promise<ResultMeta[]>;
  getResult(id: number): Promise<ResultMeta>;
  getFields(id: number): Promise<GeoJSON.FeatureCollection>;
  /** A link that downloads the result (GeoJSON by default). */
  downloadUrl(id: number, format?: DownloadFormat): string;
  /** The variant catalog (GET /api/variants). */
  variants?(): Promise<Variant[]>;
  /** The run log of a result; null when it has none (older results). */
  getRunLog?(resultId: number): Promise<RunLog | null>;
}
