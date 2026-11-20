// Dates of a request: one date or an interval. Strings are YYYY-MM-DD (UTC), compared as strings.

export const FIRST_SCENE = "2017-01-01";
export const MAX_INTERVAL_DAYS = 366;

export const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const min = (a: string, b: string) => (a < b ? a : b);

export type DateMode = "one" | "interval";
export interface Dates {
  mode: DateMode;
  /** The date in "one" mode. */
  start: string;
  end: string;
}

/** What the API gets: one date is a one-day interval. */
export const toInterval = (d: Dates) => (d.mode === "one" ? { start: d.start, end: d.start } : { start: d.start, end: d.end });

/** Why these dates cannot be sent, in Russian; null when they can. Mirrors the Worker's checks. */
export function datesError(d: Dates, now = today()): string | null {
  const { start, end } = toInterval(d);
  if (!start || !end) return "Укажите даты";
  if (start < FIRST_SCENE || end > now) return `Даты — с ${FIRST_SCENE} по сегодня`;
  if (start > end) return "Начало интервала позже конца";
  if (daysBetween(start, end) > MAX_INTERVAL_DAYS) return "Интервал — не больше года";
  return null;
}

/** The US growing season (1 March – 30 September) of a year, cut at today. */
export const usSeason = (year: number, now = today()) => ({ start: `${year}-03-01`, end: min(`${year}-09-30`, now) });
/** The calendar year, cut at today. */
export const wholeYear = (year: number, now = today()) => ({ start: `${year}-01-01`, end: min(`${year}-12-31`, now) });

/** The last season that has ended (before October: the previous year's). */
export function lastSeasonYear(now = today()): number {
  const year = Number(now.slice(0, 4));
  return now >= `${year}-10-01` ? year : year - 1;
}

/** "2025-07-15" for one date, "2021-03-01 – 2021-09-30" for an interval; older jobs have only `date`. */
export function formatDates(j: { date: string; start_date?: string; end_date?: string }): string {
  const start = j.start_date ?? j.date;
  const end = j.end_date ?? j.date;
  return start === end ? start : `${start} – ${end}`;
}
