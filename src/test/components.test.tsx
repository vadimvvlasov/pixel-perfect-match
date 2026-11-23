import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusBadge } from "@/components/fields/StatusBadge";
import { PointForm } from "@/components/fields/PointForm";
import { JobStatusCard } from "@/components/fields/JobStatusCard";
import { ResultCard } from "@/components/fields/ResultCard";
import { HistoryList } from "@/components/fields/HistoryList";
import { ShortcutsDialog } from "@/components/fields/ShortcutsDialog";
import { NoWebGLNotice } from "@/components/fields/NoWebGLNotice";
import { CursorPill } from "@/components/fields/CursorPill";
import { ru } from "@/i18n/ru";
import type { Job, ResultMeta } from "@/services/api/types";

afterEach(cleanup);
const job = (over: Partial<Job> = {}): Job => ({
  id: 7, lon: -90.7765, lat: 44.9128, date: "2021-07-15", start_date: "2021-07-15", end_date: "2021-07-15",
  status: "running", message: null, cell: "15TWJ", scene_date: null, result_id: null, created_at: "2026-11-18T00:00:00Z", ...over,
});
const meta: ResultMeta = { id: 3, cell: "15TWJ", scene_date: "2021-07-15", model_version: "abc", cell_geom: { type: "Polygon", coordinates: [] }, n_fields: 55 };

describe("components", () => {
  it("StatusBadge shows the Russian status", () => {
    render(<StatusBadge status="done" />);
    expect(screen.getByText("Готово")).toBeTruthy();
  });
  it("PointForm parses on paste and Enter", () => {
    const onParse = vi.fn(), onText = vi.fn();
    render(<PointForm text="1, 2" error="" onText={onText} onParse={onParse} />);
    const input = screen.getByTestId("point-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onParse).toHaveBeenCalledWith("1, 2");
    fireEvent.paste(input, { clipboardData: { getData: () => "3, 4" } });
    expect(onParse).toHaveBeenLastCalledWith("3, 4");
  });
  it("JobStatusCard shows status and cell", () => {
    render(<JobStatusCard job={job()} disconnected={false} />);
    expect(screen.getByTestId("job-status").textContent).toContain(ru.status.running);
    expect(screen.getByText(/15TWJ/)).toBeTruthy();
  });
  it("ResultCard shows count and download", () => {
    render(<ResultCard result={meta} pending={false} failed={false} downloadUrl={(id) => `/x/${id}`} onRetry={() => {}} />);
    expect(screen.getByTestId("result-fields-count").textContent).toBe("55");
    expect(screen.getByTestId("download-geojson").getAttribute("href")).toBe("/x/3");
  });
  it("HistoryList puts running first", () => {
    render(<HistoryList jobs={[job({ id: 1, status: "done" }), job({ id: 2 })]} pending={false} failed={false} onRetry={() => {}} onSelect={() => {}} />);
    expect(screen.getAllByTestId("history-item").map((e) => e.getAttribute("data-status"))).toEqual(["running", "done"]);
  });
  it("ShortcutsDialog renders only when open", () => {
    const { rerender } = render(<ShortcutsDialog open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<ShortcutsDialog open onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("NoWebGLNotice and CursorPill render", () => {
    render(<><NoWebGLNotice /><CursorPill cursor={{ lat: 44.9128, lon: -90.7765 }} zoom={6} /></>);
    expect(screen.getByTestId("cursor-pill").textContent).toContain("44.91280, -90.77650");
  });
});
