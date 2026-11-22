import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RequestDatePicker } from "./RequestDatePicker";
import { ru as t } from "@/i18n/ru";
import { today, usSeason, wholeYear } from "@/lib/dates";

export interface DatesInputProps {
  interval: boolean;
  intervalsEnabled: boolean;
  date: string;
  start: string;
  end: string;
  error: string | null;
  onInterval(interval: boolean): void;
  onDate(date: string): void;
  onRange(start: string, end: string): void;
}

/** «Когда»: one date or an interval with the season / whole-year presets. */
export function DatesInput(p: DatesInputProps) {
  const year = Number(p.date.slice(0, 4));
  const preset = (full: boolean) => {
    const r = full ? wholeYear(year, today()) : usSeason(year, today());
    p.onRange(r.start, r.end);
  };
  const toInterval = () => {
    p.onInterval(true);
    preset(false);
  };
  return (
    <section className="date-section">
      <h2 className="section-title">
        <CalendarDays />
        {t.when}
        <span className="section-number">02</span>
      </h2>
      <ToggleGroup
        className="segment"
        type="single"
        value={p.interval ? "interval" : "one"}
        onValueChange={(value) => {
          if (!value) return;
          if (value === "interval") toInterval();
          else p.onInterval(false);
        }}
      >
        <ToggleGroupItem value="one" className={!p.interval ? "is-active" : "is-inactive"} onClick={() => p.onInterval(false)}>
          {t.single}
        </ToggleGroupItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex" tabIndex={!p.intervalsEnabled ? 0 : -1}>
              <ToggleGroupItem
                value="interval"
                className={p.interval ? "is-active w-full" : "is-inactive w-full"}
                disabled={!p.intervalsEnabled}
                onClick={toInterval}
              >
                {t.interval}
              </ToggleGroupItem>
            </span>
          </TooltipTrigger>
          {!p.intervalsEnabled && <TooltipContent>{t.intervalDisabled}</TooltipContent>}
        </Tooltip>
      </ToggleGroup>
      {!p.interval ? (
        <div className="date-entry">
          <RequestDatePicker start={p.date} onStart={p.onDate} />
          <input
            className="sr-only"
            type="date"
            min="2017-01-01"
            max={today()}
            aria-label={t.date}
            data-testid="date-input"
            value={p.date}
            onChange={(e) => p.onDate(e.target.value)}
          />
        </div>
      ) : (
        <>
          <div className="range-inputs sr-only">
            <div>
              <label className="point-label" htmlFor="start">{t.start}</label>
              <input id="start" type="date" className="field-input" data-testid="interval-start" min="2017-01-01" max={today()} value={p.start} onChange={(e) => p.onRange(e.target.value, p.end)} />
            </div>
            <div>
              <label className="point-label" htmlFor="end">{t.end}</label>
              <input id="end" type="date" className="field-input" data-testid="interval-end" min="2017-01-01" max={today()} value={p.end} onChange={(e) => p.onRange(p.start, e.target.value)} />
            </div>
          </div>
          <div className="presets">
            <Button variant="secondary" onClick={() => preset(false)}>{t.season(year)}</Button>
            <Button variant="secondary" onClick={() => preset(true)}>{t.year(year)}</Button>
          </div>
          <RequestDatePicker range start={p.start} end={p.end} onStart={(s) => p.onRange(s, p.end)} onEnd={(e) => p.onRange(p.start, e)} />
        </>
      )}
      {p.error && <div className="error-text">{p.error}</div>}
    </section>
  );
}
