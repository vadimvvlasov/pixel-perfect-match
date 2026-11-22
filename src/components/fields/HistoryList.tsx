import { ChevronRight, History, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ru as t, formatRange } from "@/i18n/ru";
import { orderJobs } from "@/lib/job-order";
import type { Job } from "@/services/api/types";
import { StatusBadge } from "./StatusBadge";

export interface HistoryListProps {
  jobs: readonly Job[] | undefined;
  pending: boolean;
  failed: boolean;
  onRetry(): void;
  onSelect(job: Job): void;
}

/** «Мои запросы»: compact rows, running first. */
export function HistoryList({ jobs, pending, failed, onRetry, onSelect }: HistoryListProps) {
  return (
    <section className="history-section">
      <div className="history-heading">
        <h2 className="section-title">
          <History className="!text-muted-foreground" />
          {t.history}
        </h2>
        <span className="history-counter">{jobs?.length ?? 0}</span>
      </div>
      {pending ? (
        <div className="skeleton-line" />
      ) : failed ? (
        <>
          <p className="error-text">{t.networkError}</p>
          <Button variant="outline" onClick={onRetry}>
            {t.retry}
          </Button>
        </>
      ) : !jobs?.length ? (
        <div className="history-empty">
          <ScanLine />
          <span>{t.emptyHistory}</span>
        </div>
      ) : (
        orderJobs([...jobs]).map((j) => (
          <Button key={j.id} variant="ghost" className="history-row" data-testid="history-item" data-status={j.status} onClick={() => onSelect(j)}>
            <div className="history-text">
              {formatRange(j.start_date, j.end_date)}
              <span>{j.cell ?? `${j.lat.toFixed(4)}, ${j.lon.toFixed(4)}`}</span>
            </div>
            <StatusBadge status={j.status} />
            <ChevronRight size={12} />
          </Button>
        ))
      )}
    </section>
  );
}
