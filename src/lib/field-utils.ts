import { ru } from "@/i18n/ru";
import { datesError, usSeason, wholeYear } from "./dates";
export interface Point {
  lon: number;
  lat: number;
}
export function parsePoint(value: string): Point | null {
  const wkt = value.trim().match(/^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i);
  let lat: number, lon: number;
  if (wkt) {
    lon = Number(wkt[1]);
    lat = Number(wkt[2]);
  } else {
    const m = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    lat = Number(m[1]);
    lon = Number(m[2]);
    if (Math.abs(lat) > 90) [lat, lon] = [lon, lat];
  }
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}
export const isoToday = (now = new Date()) => now.toISOString().slice(0, 10);
export function validateDates(start: string, end: string, today = isoToday()): string | null {
  const valid = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    s >= "2017-01-01" &&
    s <= today &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  if (!valid(start) || !valid(end)) return ru.dateInvalid;
  return datesError({ mode: "interval", start, end }, today);
}
export function presetRange(date: string, full = false, today = isoToday()) {
  const year = Number(date.slice(0, 4));
  return full ? wholeYear(year, today) : usSeason(year, today);
}
export const pointText = (p: Point) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
