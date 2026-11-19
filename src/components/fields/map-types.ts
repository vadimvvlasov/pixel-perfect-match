import type * as GeoJSON from "geojson";
import type { Point } from "@/lib/field-utils";
import type { ResultMeta, Bbox } from "@/services/api/types";
export interface MapHandle {
  placeMarker(p: Point, fly?: boolean): void;
  showResult(meta: ResultMeta, fields: GeoJSON.FeatureCollection): void;
  showCells(results: ResultMeta[] | null): void;
  fitTo(geom: GeoJSON.Polygon): void;
  zoom(delta: number): void;
  setLayer(name: "fields" | "cells" | "labels", visible: boolean): void;
}
export interface MapProps {
  onPoint(p: Point): void;
  onCursor(p: Point, zoom: number): void;
  onBounds(b: Bbox): void;
  onResult(id: number): void;
  onReady(): void;
}
