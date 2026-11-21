import { describe, expect, it } from "vitest";
import { datesError, toInterval, usSeason, wholeYear } from "@/lib/dates";
import { orderJobs } from "@/lib/job-order";
import { MockFieldsApi } from "@/services/api/mock/MockFieldsApi";

describe("P1 contract parity", () => {
  it("sends a single date as an identical start and end", () => {
    expect(toInterval({ mode: "one", start: "2021-07-15", end: "2021-09-30" })).toEqual({ start: "2021-07-15", end: "2021-07-15" });
  });
  it("uses March 1 through September 30 for the US season", () => {
    expect(usSeason(2021, "2026-11-20")).toEqual({ start: "2021-03-01", end: "2021-09-30" });
  });
  it("cuts the current calendar year at today", () => {
    expect(wholeYear(2026, "2026-11-20")).toEqual({ start: "2026-01-01", end: "2026-11-20" });
  });
  it("enforces the supplied 366-day interval limit", () => {
    expect(datesError({ mode: "interval", start: "2020-01-01", end: "2021-01-01" }, "2026-11-20")).toBeNull();
    expect(datesError({ mode: "interval", start: "2020-01-01", end: "2021-01-02" }, "2026-11-20")).not.toBeNull();
  });
  it("puts running work first even when a completed request is newer", async () => {
    let clock = Date.parse("2026-11-20T00:00:00Z");
    const api = new MockFieldsApi({ now: () => clock });
    const request = { lon: -90.7765, lat: 44.9128, start: "2021-07-15", end: "2021-07-15" };
    const first = await api.createJob(request);
    clock += 8000;
    const done = await api.getJob(first.id);
    const active = await api.createJob(request);
    const ordered = orderJobs([{ ...done, id: 9 }, active]);
    expect(ordered.map((j) => j.id)).toEqual([2, 9]);
  });
});