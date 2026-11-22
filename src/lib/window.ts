import { FIRST_SCENE, today } from "./dates";

/** One date → the window the backend searches: the date ± 15 days, cut to [FIRST_SCENE, today]. */
export const WINDOW_DAYS = 15;

const shift = (d: string, days: number) => new Date(Date.parse(d) + days * 86_400_000).toISOString().slice(0, 10);

export function dateWindow(date: string, now = today()): { start: string; end: string } {
  const start = shift(date, -WINDOW_DAYS);
  const end = shift(date, WINDOW_DAYS);
  return { start: start < FIRST_SCENE ? FIRST_SCENE : start, end: end > now ? now : end };
}
