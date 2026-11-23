import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ru } from "@/i18n/ru";
import { StatusBadge as Status } from "@/components/fields/StatusBadge";
import { ResultCard } from "@/components/fields/ResultCard";
import type { ResultMeta } from "@/services/api/types";
import { toast } from "sonner";
export const Route = createFileRoute("/_design")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw new Error("Unavailable");
  },
  head: () => ({
    meta: [
      { title: ru.design },
      { name: "description", content: ru.design },
      { property: "og:title", content: ru.design },
      { property: "og:description", content: ru.design },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Design,
});
const SAMPLE: ResultMeta = {
  id: 1,
  cell: "MOCK_-908_449",
  scene_date: "2021-07-15",
  model_version: "a3d3a5600f80",
  cell_geom: { type: "Polygon", coordinates: [] },
  n_fields: 56,
};
function Design() {
  return (
    <main className="design-page">
      <h1>{ru.design}</h1>
      <h2>{ru.tokens}</h2>
      <div className="token-grid">
        {[
          ["primary", ru.selected],
          ["fields", ru.fieldLayer],
          ["cells", ru.cellLayer],
          ["success", ru.status.done],
          ["sen2sr", ru.sen2sr],
          ["tci", ru.tci],
        ].map(([token, label]) => (
          <div key={token}>
            <div
              className={`token-sample ${token === "primary" ? "bg-primary" : token === "fields" ? "bg-fields" : token === "cells" ? "bg-cells" : token === "sen2sr" ? "bg-sen2sr" : token === "tci" ? "bg-tci" : "bg-success"}`}
            />
            {label}
          </div>
        ))}
      </div>
      <h2>{ru.typography}</h2>
      <div className="space-y-3">
        <p className="text-xl font-semibold">{ru.title}</p>
        <p className="text-sm">{ru.warning}</p>
        <p className="font-mono text-xs text-muted-foreground">MOCK_-908_449 · 44.91280, -90.77650</p>
      </div>
      <h2>{ru.point}</h2>
      <input aria-label={ru.point} placeholder={ru.placeholder} className="field-input font-mono max-w-sm" />
      <h2>{ru.badges}</h2>
      <div className="flex flex-wrap gap-4">
        <Status status="queued" /><Status status="locating" /><Status status="waiting_gpu" />
        <Status status="running" /><Status status="done" /><Status status="no_scene" /><Status status="failed" />
      </div>
      <h2>{ru.cards}</h2>
      <div className="side-panel-demo max-w-sm">
        <ResultCard result={SAMPLE} pending={false} failed={false} downloadUrl={() => "#"} onRetry={() => toast.success(ru.resultsReady)} />
      </div>
      <h2>{ru.notifications}</h2>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => toast.success(ru.resultsReady)}>{ru.resultsReady}</Button>
        <Button variant="outline" onClick={() => toast.error(ru.failedToast)}>{ru.failedToast}</Button>
      </div>
      <h2>{ru.skeletons}</h2>
      <div className="max-w-sm space-y-3"><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /></div>
      <h2>{ru.controls}</h2>
      <div className="flex flex-wrap gap-4">
        <Button>{ru.submit}</Button>
        <Button variant="outline">{ru.download}</Button>
        <Status status="running" />
        <Status status="done" />
        <Status status="no_scene" />
      </div>
    </main>
  );
}
