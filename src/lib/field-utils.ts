import { ru } from "@/i18n/ru";
import { datesError, usSeason, wholeYear } from "./dates";
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
