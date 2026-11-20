import { ApiError, AuthRequiredError, errorFor, NetworkError } from "../errors";
import type { FieldsApi } from "../FieldsApi";
import type { Bbox, Job, JobRequest, Me, ResultMeta } from "../types";

/** The Worker's API on the same origin (the session cookie goes along). The only place that calls `fetch`. */
export class HttpFieldsApi implements FieldsApi {
  constructor(
    private readonly base = "",
    private readonly fetchImpl: typeof fetch = (...a) => fetch(...a),
  ) {}

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(this.base + path, { ...init, headers: { "content-type": "application/json" }, credentials: "same-origin" });
    } catch {
      throw new NetworkError();
    }
    const json = (res.headers.get("content-type") ?? "").includes("json");
    if (!json && res.ok) throw new AuthRequiredError("нет доступа: войдите заново", res.status); // a login page
    if (!res.ok) {
      const body = json ? await res.json().catch(() => ({})) : {};
      throw errorFor(res.status, typeof body.error === "string" ? body.error : `${res.status} ${res.statusText}`.trim());
    }
    try {
      return (await res.json()) as T;
    } catch {
      throw new ApiError("сервер ответил не JSON", res.status);
    }
  }

  me = () => this.call<Me>("/api/me");
  createJob = (r: JobRequest) => this.call<Job>("/api/jobs", { method: "POST", body: JSON.stringify(r) });
  listJobs = () => this.call<Job[]>("/api/jobs");
  getJob = (id: number) => this.call<Job>(`/api/jobs/${id}`);
  listResults = (b: Bbox) => this.call<ResultMeta[]>(`/api/results?bbox=${b.join(",")}`);
  getResult = (id: number) => this.call<ResultMeta>(`/api/results/${id}`);
  getFields = (id: number) => this.call<GeoJSON.FeatureCollection>(`/api/results/${id}/fields.geojson`);
  downloadUrl = (id: number) => `${this.base}/api/results/${id}/fields.geojson?download=1`;
}
