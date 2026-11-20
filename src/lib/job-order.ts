import { FINISHED, type Job } from "@/services/api/types";

export function orderJobs(jobs: readonly Job[]): Job[] {
  return [...jobs].sort((a, b) =>
    Number(FINISHED.includes(a.status)) - Number(FINISHED.includes(b.status)) || b.id - a.id,
  ).slice(0, 20);
}