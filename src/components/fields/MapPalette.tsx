import { ArrowUpRight, History, MapPin } from "lucide-react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ru, formatDate } from "@/i18n/ru";
import { parsePoint, pointText } from "@/lib/field-utils";
import type { Job } from "@/services/api/types";

export function MapPalette({ open, onClose, search, onSearch, onGo, jobs, onJob }: {
  open: boolean; onClose: () => void; search: string; onSearch: (value: string) => void;
  onGo: () => void; jobs: readonly Job[]; onJob: (job: Job) => void;
}) {
  return <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent className="w-[calc(100%-32px)] overflow-hidden p-0" aria-describedby={undefined}>
      <DialogTitle className="sr-only">{ru.search}</DialogTitle>
      <Command shouldFilter={false}>
        <CommandInput placeholder={ru.searchPlaceholder} value={search} onValueChange={onSearch} className="pr-12" />
        <CommandList className="p-2">
          {search && <CommandItem value="point" onSelect={onGo}><MapPin />{parsePoint(search) ? ru.go : search}<ArrowUpRight className="ml-auto" /></CommandItem>}
          <CommandGroup heading={ru.recent}>
            {jobs.map((job) => <CommandItem key={job.id} value={String(job.id)} onSelect={() => { onJob(job); onClose(); }}>
              <History />{job.cell ?? pointText(job)}<span className="ml-auto text-xs text-muted-foreground">{formatDate(job.date, true)}</span>
            </CommandItem>)}
            {!jobs.length && <p className="p-3 text-xs text-muted-foreground">{ru.empty}</p>}
          </CommandGroup>
        </CommandList>
      </Command>
    </DialogContent>
  </Dialog>;
}