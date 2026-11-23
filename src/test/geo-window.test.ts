import { describe, expect, it } from "vitest";
import { bboxOf, formatLatLon, labelPoint, parseCoords, polygonBounds } from "@/lib/geo";
import { dateWindow } from "@/lib/window";

const square: GeoJSON.Polygon = { type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]]] };

describe("geo", () => {
  it("formats lat, lon with 5 decimals", () => expect(formatLatLon({ lat: 44.9128, lon: -90.7765 })).toBe("44.91280, -90.77650"));
  it("reads lat, lon / WKT / swaps out-of-range first", () => {
    expect(parseCoords("44.9, -90.7")).toEqual({ lat: 44.9, lon: -90.7 });
    expect(parseCoords("POINT(-90.7 44.9)")).toEqual({ lat: 44.9, lon: -90.7 });
    expect(parseCoords("-100.2, 44.9")).toEqual({ lat: 44.9, lon: -100.2 });
    expect(parseCoords("abc")).toBeNull();
  });
  it("bbox and label point", () => {
    expect(bboxOf(square)).toEqual([[0, 0], [2, 1]]);
    expect(labelPoint(square)).toEqual([1, 1]);
    expect(polygonBounds(square)).toEqual([0, 0, 2, 1]);
    expect(polygonBounds({ type: "Polygon", coordinates: [] })).toBeNull();
  });
});

describe("dateWindow", () => {
  it("one date means date ± 15 days", () => expect(dateWindow("2021-07-15", "2026-11-18")).toEqual({ start: "2021-06-30", end: "2021-07-30" }));
  it("cuts at 2017-01-01 and today", () => {
    expect(dateWindow("2017-01-05", "2026-11-18").start).toBe("2017-01-01");
    expect(dateWindow("2026-11-10", "2026-11-18").end).toBe("2026-11-18");
  });
});
