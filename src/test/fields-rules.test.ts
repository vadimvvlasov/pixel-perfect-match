import { describe, expect, it } from "vitest";
import { validateDates, presetRange } from "@/lib/field-utils";
import { parseCoords as parsePoint } from "@/lib/geo";
import { BrowserMockFieldsApi } from "@/services/api/mock/BrowserMockFieldsApi";
import { MockFieldsApi } from "@/services/api/mock/MockFieldsApi";
import {
  AuthRequiredError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@/services/api/errors";
import { ru } from "@/i18n/ru";
const request = { lon: -90.7765, lat: 44.9128, start: "2021-07-15", end: "2021-07-15" };
const now = Date.parse("2026-11-18T12:00:00Z");
describe("coordinate parsing", () => {
  it("accepts latitude,longitude", () =>
    expect(parsePoint("44.91280, -90.77650")).toEqual({ lat: 44.9128, lon: -90.7765 }));
  it("accepts WKT longitude first", () =>
    expect(parsePoint("POINT(-90.7765 44.9128)")).toEqual({ lat: 44.9128, lon: -90.7765 }));
  it("swaps a first number outside latitude range", () =>
    expect(parsePoint("-100.2, 44.9")).toEqual({ lat: 44.9, lon: -100.2 }));
  it("rejects invalid points", () => {
    expect(parsePoint("hello")).toBeNull();
    expect(parsePoint("91, 181")).toBeNull();
  });
});
describe("date rules", () => {
  it("rejects reversed dates", () =>
    expect(validateDates("2021-09-01", "2021-03-01")).toBe(ru.dateOrder));
  it("allows the supplied 366-day difference and rejects 367", () => {
    expect(validateDates("2020-01-01", "2020-12-31")).toBeNull();
    expect(validateDates("2020-01-01", "2021-01-01")).toBeNull();
    expect(validateDates("2020-01-01", "2021-01-02")).toBe(ru.dateLength);
  });
  it("rejects pre-Sentinel, future and impossible dates", () => {
    for (const date of ["2016-12-31", "2027-01-01", "2021-02-30"])
      expect(validateDates(date, date, "2026-11-18")).toBe(ru.dateInvalid);
  });
  it("sets US season March 1 through September 30", () =>
    expect(presetRange("2021-07-15")).toEqual({ start: "2021-03-01", end: "2021-09-30" }));
  it("cuts full year at today", () =>
    expect(presetRange("2026-07-15", true, "2026-11-18")).toEqual({
      start: "2026-01-01",
      end: "2026-11-18",
    }));
});
describe("deterministic mock", () => {
  it("follows queued,locating,running,done clock and generates fields", async () => {
    let time = now;
    const api = new MockFieldsApi({ now: () => time, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    const j = await api.createJob(request);
    expect(j.status).toBe("queued");
    time += 1000;
    expect((await api.getJob(j.id)).status).toBe("locating");
    time += 2000;
    expect((await api.getJob(j.id)).status).toBe("running");
    time += 5000;
    const done = await api.getJob(j.id);
    expect(done.status).toBe("done");
    expect(done.cell).toBe("MOCK_-908_449");
    if (done.result_id === null) throw Error("result absent");
    const f = await api.getFields(done.result_id);
    expect(f.features).toHaveLength(55);
    expect(f.features.every((x) => Number(x.properties?.["area_ha"]) > 0)).toBe(true);
    expect(api.downloadUrl(done.result_id)).toMatch(/^data:application\/geo\+json/);
  });
  it("limits in-progress jobs to 3", async () => {
    const api = new MockFieldsApi({ now: () => now, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    for (let n = 0; n < 3; n++) await api.createJob(request);
    await expect(api.createJob(request)).rejects.toThrow(RateLimitError);
  });
  it("returns not found for another job", async () => {
    const api = new MockFieldsApi({ now: () => now, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    await expect(api.getJob(999)).rejects.toThrow(NotFoundError);
  });
  it("validates intervals in service", async () => {
    const api = new MockFieldsApi({ now: () => now, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    await expect(
      api.createJob({ ...request, start: "2021-08-01", end: "2021-01-01" }),
    ).rejects.toThrow("start must not be after end");
    await expect(
      api.createJob({ ...request, start: "2020-01-01", end: "2021-01-02" }),
    ).rejects.toThrow("the interval is at most 366 days");
    await expect(api.createJob({ ...request, start: "2016-01-01" })).rejects.toThrow(
      ValidationError,
    );
  });
  it("validates coordinates in service", async () => {
    const api = new MockFieldsApi({ now: () => now, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    await expect(api.createJob({ ...request, lat: 91 })).rejects.toThrow(ValidationError);
  });
  it("reuses cell and scene", async () => {
    let time = now;
    const api = new MockFieldsApi({ now: () => time, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    const a = await api.createJob(request);
    time += 8000;
    const first = await api.getJob(a.id);
    const b = await api.createJob(request);
    time += 8000;
    const second = await api.getJob(b.id);
    expect(second.result_id).toBe(first.result_id);
    expect(second.message).toBe("already computed");
  });
  it("selects scene inside interval", async () => {
    let time = now;
    const api = new MockFieldsApi({ now: () => time, scenario: "default", latencyMs: 0, email: "agronom@example.com" });
    const j = await api.createJob({ ...request, start: "2021-03-01", end: "2021-09-30" });
    time += 8000;
    const done = await api.getJob(j.id);
    if (done.scene_date === null) throw Error("scene absent");
    expect(done.scene_date >= "2021-03-01" && done.scene_date <= "2021-09-30").toBe(true);
  });
  it("handles no-scene", async () => {
    let time = now;
    const api = new MockFieldsApi({ now: () => time, scenario: "no-scene", latencyMs: 0, email: "agronom@example.com" });
    const j = await api.createJob(request);
    time += 8000;
    expect((await api.getJob(j.id)).status).toBe("no_scene");
  });
  it("handles auth", async () => {
    await expect(new MockFieldsApi({ now: () => now, scenario: "auth", latencyMs: 0, email: "agronom@example.com" }).me()).rejects.toThrow(AuthRequiredError);
  });
  it("handles rate-limited", async () => {
    await expect(
      new MockFieldsApi({ now: () => now, scenario: "rate-limited", latencyMs: 0, email: "agronom@example.com" }).createJob(request),
    ).rejects.toThrow(RateLimitError);
  });
  it("every fourth flaky call fails", async () => {
    const api = new MockFieldsApi({ now: () => now, scenario: "flaky", latencyMs: 0, email: "agronom@example.com" });
    for (let i = 0; i < 3; i++) await api.me();
    await expect(api.me()).rejects.toThrow(NetworkError);
    expect(await api.me()).toEqual({ email: "agronom@example.com" });
  });
  it("restores in-progress work after reload", async () => {
    sessionStorage.clear();
    let time = now;
    const api = await BrowserMockFieldsApi.create(() => time, "default", 0, sessionStorage);
    const j = await api.createJob(request);
    const restored = await BrowserMockFieldsApi.create(() => time, "default", 0, sessionStorage);
    expect((await restored.listJobs())[0]?.id).toBe(j.id);
    time += 8000;
    expect((await restored.getJob(j.id)).status).toBe("done");
  });
});
