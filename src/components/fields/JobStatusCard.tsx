import { ru as t, formatDate, formatRange, jobMessage } from "@/i18n/ru";
import { FINISHED, type Job } from "@/services/api/types";
import { StatusBadge } from "./StatusBadge";

/** The job after submit: status, cell and scene when known, the interval, the message. */
export function JobStatusCard({ job, disconnected }: { job: Job; disconnected: boolean }) {
  const running = !FINISHED.includes(job.status);
  return (
    <section className="job-block">
      <div className="job-heading">
        <span data-testid="job-status">
          <StatusBadge status={job.status} />
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">#{job.id.toString().padStart(3, "0")}</span>
      </div>
      {running && (
        <div className="job-progress">
          <span />
        </div>
      )}
      <div className="job-meta">
        {job.cell && (
          <>
            <span className="font-mono">
              {t.cell} {job.cell}
            </span>
            <br />
          </>
        )}
        {job.scene_date && (
          <>
            {t.scene} {formatDate(job.scene_date)}
            <br />
          </>
        )}
        {job.start_date !== job.end_date && (
          <>
            {t.interval} {formatRange(job.start_date, job.end_date)}
            <br />
          </>
        )}
        <span data-testid="job-message">{jobMessage(job.message)}</span>
        {disconnected && <div className="text-warning">{t.disconnected}</div>}
      </div>
    </section>
  );
}
