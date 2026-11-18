import type { FieldsApi } from '../FieldsApi';
import type { Job, JobRequest, ResultMeta, Me, Bbox } from '../types';
import { ApiError, AuthRequiredError, ValidationError, NotFoundError, ConflictError, RateLimitError, NetworkError } from '../errors';
export class HttpFieldsApi implements FieldsApi {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response; try { response = await fetch(`/api/${path}`, { credentials: 'same-origin', ...init }); } catch { throw new NetworkError(); }
    if (response.headers.get('content-type')?.includes('text/html')) throw new AuthRequiredError();
    let body; try { body = await response.json(); } catch { throw new NetworkError(); }
    if (!response.ok) { const m = body.error ?? response.statusText; const classes: Record<number, new (s: string) => ApiError> = { 400: ValidationError, 403: AuthRequiredError, 404: NotFoundError, 409: ConflictError, 429: RateLimitError }; const C = classes[response.status]; throw C ? new C(m) : new ApiError(m, response.status); }
    return body as T;
  }
  me() { return this.request<Me>('me'); }
  createJob(r: JobRequest) { return this.request<Job>('jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }); }
  listJobs() { return this.request<Job[]>('jobs'); }
  getJob(id: number) { return this.request<Job>(`jobs/${id}`); }
  listResults(bbox: Bbox) { return this.request<ResultMeta[]>(`results?bbox=${bbox.join(',')}`); }
  getResult(id: number) { return this.request<ResultMeta>(`results/${id}`); }
  getFields(id: number) { return this.request<GeoJSON.FeatureCollection>(`results/${id}/fields.geojson`); }
  downloadUrl(id: number) { return `/api/results/${id}/fields.geojson?download=1`; }
}
