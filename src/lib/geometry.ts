import type * as GeoJSON from "geojson";
import type { Bbox } from "@/services/api/types";
export function polygonBounds(geometry: GeoJSON.Polygon): Bbox | null {
  const points = geometry.coordinates
    .flat()
    .filter((p): p is [number, number] => typeof p[0] === "number" && typeof p[1] === "number");
  if (!points.length) return null;
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
  ];
}
