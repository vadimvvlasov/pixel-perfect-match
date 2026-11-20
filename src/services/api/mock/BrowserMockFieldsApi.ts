import type { FieldsApi } from "../FieldsApi";
import type { JobRequest } from "../types";
import { MockFieldsApi, SCENARIOS, type Scenario } from "./MockFieldsApi";

/** Keeps recovery outside the supplied mock: replay its requests against their original clocks. */
export class BrowserMockFieldsApi implements FieldsApi {
  private readonly api: MockFieldsApi;
  private readonly key: string;
  private requests: { request: JobRequest; at: number }[] = [];

  private constructor(
    private readonly clock: () => number,
    scenario: Scenario,
    latency: number,
    private readonly storage?: Storage,
  ) {
    this.key = `fields-p1-${scenario}`;
    this.api = new MockFieldsApi({ scenario, now: clock, latencyMs: latency, email: "agronom@example.com" });
  }

  static async create(clock = Date.now, scenario = "default", latency = 300, storage?: Storage) {
    const selected = SCENARIOS.find((s) => s === scenario) ?? "default";
    let replayClock: number | null = null;
    const instance = new BrowserMockFieldsApi(() => replayClock ?? clock(), selected, latency, storage);
    try {
      const saved = storage?.getItem(instance.key);
      const requests: unknown = saved ? JSON.parse(saved) : [];
      if (Array.isArray(requests)) {
        for (const item of requests) {
          if (!item || typeof item.at !== "number" || !item.request) continue;
          replayClock = item.at;
          // Complete older jobs before replaying the next request, retaining the mock's active-job limit.
          await instance.api.listJobs();
          await instance.api.createJob(item.request);
          instance.requests.push(item);
        }
      }
    } catch {
      // Failed or unavailable storage must never prevent the map opening.
    } finally {
      replayClock = null;
    }
    return instance;
  }

  me = () => this.api.me();
  listJobs = () => this.api.listJobs();
  getJob: FieldsApi["getJob"] = (id) => this.api.getJob(id);
  listResults: FieldsApi["listResults"] = (bbox) => this.api.listResults(bbox);
  getResult: FieldsApi["getResult"] = (id) => this.api.getResult(id);
  getFields: FieldsApi["getFields"] = (id) => this.api.getFields(id);
  downloadUrl: FieldsApi["downloadUrl"] = (id) => this.api.downloadUrl(id);
  async createJob(request: JobRequest) {
    const job = await this.api.createJob(request);
    this.requests.push({ request, at: Date.parse(job.created_at) });
    try { this.storage?.setItem(this.key, JSON.stringify(this.requests)); } catch { /* Storage is optional. */ }
    return job;
  }
}