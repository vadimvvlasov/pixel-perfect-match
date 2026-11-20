import { CalendarDays } from "lucide-react";
import { ru as locale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ru, formatDate, formatRange } from "@/i18n/ru";
import { FIRST_SCENE, today } from "@/lib/dates";

const fromIso = (date: string) => new Date(`${date}T12:00:00`);
const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function RequestDatePicker({ start, end, range = false, onStart, onEnd }: {
  start: string;
  end?: string;
  range?: boolean;
  onStart: (value: string) => void;
  onEnd?: (value: string) => void;
}) {
  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="w-full justify-start text-xs font-normal" aria-label={range ? ru.calendar : ru.date}>
        <CalendarDays />
        {start ? range && end ? formatRange(start, end) : formatDate(start) : ru.dateRequired}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-auto p-0">
      {range ? <Calendar
        className="pointer-events-auto" locale={locale} mode="range"
        defaultMonth={fromIso(start)}
        selected={{ from: fromIso(start), to: end ? fromIso(end) : undefined }}
        disabled={{ before: fromIso(FIRST_SCENE), after: fromIso(today()) }}
        onSelect={(selection) => {
          if (selection?.from) onStart(toIso(selection.from));
          if (selection?.to) onEnd?.(toIso(selection.to));
        }}
      /> : <Calendar
        className="pointer-events-auto" locale={locale} mode="single"
        defaultMonth={fromIso(start)} selected={start ? fromIso(start) : undefined}
        disabled={{ before: fromIso(FIRST_SCENE), after: fromIso(today()) }}
        onSelect={(selection) => { if (selection) onStart(toIso(selection)); }}
      />}
    </PopoverContent>
  </Popover>;
}