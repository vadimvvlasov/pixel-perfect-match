import { Badge } from "@/components/ui/badge";
import { ru } from "@/i18n/ru";
import type { JobStatus } from "@/services/api/types";

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={`status status-${status}`}>
      <span className="status-dot" />
      <span>{ru.status[status]}</span>
    </Badge>
  );
}
