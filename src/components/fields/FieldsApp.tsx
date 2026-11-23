import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ru as t } from "@/i18n/ru";
import { validateDates } from "@/lib/field-utils";
import { formatLatLon, parseCoords, type LonLat } from "@/lib/geo";
import { INTERVALS_ENABLED } from "@/config";
import { isMock } from "@/services/api/mode";
import { AuthRequiredError, FINISHED, useApi, type Bbox, type Job } from "@/services/api";
import { useCreateJob, useFields, useJob, useJobs, useMe, useResult, useResults } from "@/services/api/hooks";
import type { MapHandle } from "./map-types";
import { SidePanel, type Snap } from "./SidePanel";
import { PointForm } from "./PointForm";
import { DatesInput } from "./DatesInput";
import { SubmitArea } from "./SubmitArea";
import { JobStatusCard } from "./JobStatusCard";
import { ResultCard } from "./ResultCard";
import { HistoryList } from "./HistoryList";
import { MapChrome, type LayerName } from "./MapChrome";
import { CursorPill } from "./CursorPill";
import { MapPalette } from "./MapPalette";
import { ShortcutsDialog } from "./ShortcutsDialog";

const MapView = lazy(() => import("./MapView"));

/** The container: state, API hooks and the map handle; every view is its own component. */
export default function FieldsApp() {
  const api = useApi(), client = useQueryClient();
  const map = useRef<MapHandle>(null), input = useRef<HTMLInputElement>(null);
  const me = useMe(), jobs = useJobs(), create = useCreateJob();
  const [seed, setSeed] = useState<Job | null>(null), current = useJob(seed);
  const job = current.data ?? seed;
  const [point, setPoint] = useState<LonLat | null>(null), [text, setText] = useState(""), [pointError, setPointError] = useState("");
  const [date, setDate] = useState("2021-07-15"), [start, setStart] = useState("2021-03-01"), [end, setEnd] = useState("2021-09-30");
  const [interval, setInterval] = useState(false);
  const [collapsed, setCollapsed] = useState(false), [snap, setSnap] = useState<Snap>("half");
  const [bbox, setBbox] = useState<Bbox>([-180, -90, 180, 90]), results = useResults(bbox);
  const [resultId, setResultId] = useState<number | null>(null), result = useResult(resultId), fields = useFields(resultId);
  const [mapReady, setMapReady] = useState(false), [cursor, setCursor] = useState({ lat: 42, lon: -93.6, zoom: 6 });
  const [layersOpen, setLayersOpen] = useState(false), [layers, setLayers] = useState({ fields: true, cells: true, labels: true });
  const [modal, setModal] = useState<"search" | "help" | null>(null), [search, setSearch] = useState("");
  const [scenario, setScenario] = useState("default");
  const notified = useRef<number | null>(null), displayed = useRef<number | null>(null);

  const dateError = validateDates(interval ? start : date, interval ? end : date);
  const running = !!job && !FINISHED.includes(job.status);
  const auth = [me.error, jobs.error, current.error, create.error, result.error, fields.error, results.error].some((e) => e instanceof AuthRequiredError);

  useEffect(() => setScenario(new URLSearchParams(window.location.search).get("scenario") ?? "default"), []);
  useEffect(() => {
    const active = jobs.data?.find((j) => !FINISHED.includes(j.status));
    if (!seed && active) setSeed(active);
  }, [jobs.data, seed]);
  useEffect(() => {
    if (!job || notified.current === job.id || !FINISHED.includes(job.status)) return;
    notified.current = job.id;
    if (job.status === "done" && job.result_id !== null) {
      setResultId(job.result_id);
      toast.success(t.resultsReady);
      void client.invalidateQueries({ queryKey: ["results"] });
    } else if (job.status === "failed") toast.error(t.failedToast);
  }, [job, client]);
  useEffect(() => {
    if (result.data && fields.data && mapReady && displayed.current !== result.data.id) {
      map.current?.showResult(result.data, fields.data);
      displayed.current = result.data.id;
    }
  }, [result.data, fields.data, mapReady]);
  useEffect(() => {
    if (mapReady) map.current?.showCells(results.data ?? null);
  }, [results.data, mapReady]);
  useEffect(() => {
    if (point && mapReady) map.current?.placeMarker(point);
  }, [point, mapReady]);

  const newRequest = () => {
    setSeed(null); setPoint(null); setText(""); setPointError("");
    create.reset(); setCollapsed(false);
    setTimeout(() => input.current?.focus(), 50);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (!typing && e.key === "/")) { e.preventDefault(); setModal("search"); }
      if (e.key === "Escape") { setModal(null); setLayersOpen(false); }
      if (!typing && e.key.toLowerCase() === "n") newRequest();
      if (!typing && e.key === "?") setModal("help");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const choose = (p: LonLat, fly = false) => {
    setPoint(p); setText(formatLatLon(p)); setPointError("");
    map.current?.placeMarker(p, fly);
  };
  const parse = (v: string) => {
    if (!v.trim()) { setPoint(null); setPointError(""); return; }
    const p = parseCoords(v);
    if (p) choose(p, true);
    else { setPointError(t.coordinateError); setPoint(null); }
  };
  const submit = () => {
    if (!point || dateError || running) return;
    create.mutate(
      { ...point, start: interval ? start : date, end: interval ? end : date },
      { onSuccess: (j) => { setSeed(j); notified.current = null; } },
    );
  };
  const selectJob = (j: Job) => {
    setSeed(j);
    choose({ lat: j.lat, lon: j.lon });
    setDate(j.date); setStart(j.start_date); setEnd(j.end_date);
    setInterval(j.start_date !== j.end_date);
    if (j.result_id !== null) {
      displayed.current = null;
      setResultId(j.result_id);
      if (result.data?.id === j.result_id && fields.data) map.current?.showResult(result.data, fields.data);
    }
  };
  const searchGo = () => {
    const p = parseCoords(search);
    if (p) { choose(p, true); setModal(null); return; }
    const cell = results.data?.find((r) => r.cell.toLowerCase().includes(search.trim().toLowerCase()));
    if (cell) { map.current?.fitTo(cell.cell_geom); setResultId(cell.id); setModal(null); }
    else toast.error(t.noResults);
  };
  const toggleLayer = (name: LayerName) => {
    const next = !layers[name];
    setLayers({ ...layers, [name]: next });
    map.current?.setLayer(name, next);
  };
  const disabledReason = create.isPending ? t.loading : running ? t.calculating : (dateError ?? (!point ? t.choosePoint : ""));

  return (
    <TooltipProvider delayDuration={200}>
      <main className={`app-shell snap-${snap} ${collapsed ? "panel-collapsed" : ""}`}>
        <ClientOnly fallback={<div className="map-host" />}>
          <Suspense fallback={<div className="map-host" />}>
            <MapView
              ref={map}
              onPoint={(p) => choose(p)}
              onCursor={(p, z) => setCursor({ ...p, zoom: z })}
              onBounds={setBbox}
              onResult={(id) => { displayed.current = null; setResultId(id); }}
              onReady={() => setMapReady(true)}
            />
          </Suspense>
        </ClientOnly>
        <SidePanel
          collapsed={collapsed}
          snap={snap}
          email={me.data?.email ?? (me.isPending ? t.loading : "—")}
          onSnap={setSnap}
          onCollapse={setCollapsed}
          onNew={newRequest}
        >
          {auth ? (
            <div className="auth-notice">
              <ShieldAlert />
              <h2>{t.auth}</h2>
              <Button asChild variant="outline" className="mt-4">
                <a href="/login">{t.login}<ArrowUpRight /></a>
              </Button>
            </div>
          ) : (
            <>
              <p className="explanation">{t.explanation}</p>
              <div className="model-note"><Info /><span>{t.warning}</span></div>
              <PointForm inputRef={input} text={text} error={pointError} onText={(v) => { setText(v); setPoint(null); }} onParse={parse} />
              <DatesInput
                interval={interval}
                intervalsEnabled={INTERVALS_ENABLED}
                date={date}
                start={start}
                end={end}
                error={dateError}
                onInterval={setInterval}
                onDate={setDate}
                onRange={(s, e) => { setStart(s); setEnd(e); }}
              />
              <SubmitArea disabledReason={disabledReason} busy={create.isPending} running={running} error={create.error} dateError={dateError} onSubmit={submit} />
              {job && <JobStatusCard job={job} disconnected={current.failureCount > 0} />}
              {resultId !== null && (
                <ResultCard
                  result={result.data}
                  pending={result.isPending || fields.isPending}
                  failed={!!(result.error || fields.error)}
                  downloadUrl={(id) => api.downloadUrl(id)}
                  onRetry={() => { void result.refetch(); void fields.refetch(); }}
                />
              )}
              <HistoryList jobs={jobs.data} pending={jobs.isPending} failed={!!jobs.error} onRetry={() => void jobs.refetch()} onSelect={selectJob} />
            </>
          )}
        </SidePanel>
        <MapChrome
          scenario={isMock() ? scenario : null}
          layers={layers}
          layersOpen={layersOpen}
          legend={{
            fields: layers.fields && !!result.data,
            cells: layers.cells && cursor.zoom >= 7 && !!results.data?.length,
            selected: !!result.data,
          }}
          lat={cursor.lat}
          zoom={cursor.zoom}
          onSearch={() => setModal("search")}
          onHelp={() => setModal("help")}
          onZoom={(d) => map.current?.zoomBy(d)}
          onLocate={() => point && map.current?.placeMarker(point, true)}
          onLayersOpen={setLayersOpen}
          onToggleLayer={toggleLayer}
        />
        <CursorPill cursor={cursor} zoom={cursor.zoom} />
        <MapPalette open={modal === "search"} onClose={() => setModal(null)} search={search} onSearch={setSearch} onGo={searchGo} jobs={jobs.data ?? []} onJob={selectJob} />
        <ShortcutsDialog open={modal === "help"} onClose={() => setModal(null)} />
      </main>
    </TooltipProvider>
  );
}
