// Pure geometry and coordinate helpers (no MapLibre, no DOM), unit-tested in geo.test.ts.

export type LonLat = { lon: number; lat: number };
export type Bounds = [[number, number], [number, number]];

/** "lat, lon" with 5 decimals (about 1 m), the order most maps copy and paste. */
export const formatLatLon = (p: LonLat) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;

/** "lat, lon" as copied from most maps; "POINT(lon lat)" (WKT) and an out-of-range first number mean lon first. */
export function parseCoords(text: string): LonLat | null {
  const nums = text.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (!nums || nums.length !== 2) return null;
  let [lat, lon] = nums;
  if (/point/i.test(text) || Math.abs(lat) > 90) [lon, lat] = nums;
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lon, lat } : null;
}

/** [[west, south], [east, north]] of a polygon's outer ring. */
export function bboxOf(poly: GeoJSON.Polygon): Bounds {
  const xs = poly.coordinates[0].map((p) => p[0]);
  const ys = poly.coordinates[0].map((p) => p[1]);
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}

/** Where a cell's label goes: the top centre of its bounding box (one point per cell). */
export function labelPoint(poly: GeoJSON.Polygon): [number, number] {
  const [[x0], [x1, y1]] = bboxOf(poly);
  return [(x0 + x1) / 2, y1];
}
