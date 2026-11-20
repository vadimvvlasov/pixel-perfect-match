import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./context";
import { FINISHED, type Job, type JobRequest, type Bbox } from "./types";
import { AuthRequiredError } from "./errors";
import { orderJobs } from "@/lib/job-order";
const base = {
  refetchOnWindowFocus: false,
  retry: (n: number, e: Error) => !(e instanceof AuthRequiredError) && n < 2,
};
export function useMe() {
  const api = useApi();
  return useQuery({ ...base, queryKey: ["me"], queryFn: () => api.me() });
}
export function useJobs() {
  const api = useApi();
  return useQuery({ ...base, queryKey: ["jobs"], queryFn: () => api.listJobs() });
}
export function useJob(seed: Job | null) {
  const api = useApi(),
    client = useQueryClient();
  return useQuery({
    queryKey: ["job", seed?.id],
    enabled: !!seed,
    initialData: seed ?? undefined,
    initialDataUpdatedAt: Date.now(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!seed) throw new Error("Missing job");
      const j = await api.getJob(seed.id);
      client.setQueryData<Job[]>(["jobs"], (old) =>
        orderJobs([j, ...(old ?? []).filter((x) => x.id !== j.id)]),
      );
      return j;
    },
    refetchInterval: (q) => (q.state.data && FINISHED.includes(q.state.data.status) ? false : 3000),
    retry: (_n, e) => !(e instanceof AuthRequiredError),
    retryDelay: (n) => Math.min(6000 * 2 ** n, 30000),
  });
}
export function useCreateJob() {
  const api = useApi(),
    client = useQueryClient();
  return useMutation({
    mutationFn: (request: JobRequest) => api.createJob(request),
    onSuccess: (j) => {
      client.setQueryData(["job", j.id], j);
      client.setQueryData<Job[]>(["jobs"], (old) => [j, ...(old ?? [])].slice(0, 20));
    },
  });
}
export function useResults(bbox: Bbox) {
  const api = useApi();
  return useQuery({
    ...base,
    queryKey: ["results", ...bbox],
    queryFn: () => api.listResults(bbox),
    staleTime: 60000,
  });
}
export function useResult(id: number | null) {
  const api = useApi();
  return useQuery({
    ...base,
    queryKey: ["result", id],
    enabled: id !== null,
    queryFn: () => {
      if (id === null) throw new Error("Missing result");
      return api.getResult(id);
    },
    staleTime: Infinity,
  });
}
export function useFields(id: number | null) {
  const api = useApi();
  return useQuery({
    ...base,
    queryKey: ["fields", id],
    enabled: id !== null,
    queryFn: () => {
      if (id === null) throw new Error("Missing result");
      return api.getFields(id);
    },
    staleTime: Infinity,
  });
}
