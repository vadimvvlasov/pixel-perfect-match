import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { ApiProvider } from "@/services/api/context";
import { MockFieldsApi } from "@/services/api/mock/MockFieldsApi";
import { useJob } from "@/services/api/hooks";
import { NetworkError } from "@/services/api/errors";
import FieldsApp from "@/components/fields/FieldsApp";
const mapCalls = vi.hoisted(() => ({
  sources: new Map<string, { setData: ReturnType<typeof vi.fn> }>(),
  fitBounds: vi.fn(),
}));
vi.mock("maplibre-gl", () => ({
  setWorkerUrl: vi.fn(),
  Map: class {
    on(name: string, fn: () => void) {
      if (name === "load") queueMicrotask(fn);
      return this;
    }
    addSource(id: string) {
      mapCalls.sources.set(id, { setData: vi.fn() });
    }
    getSource(id: string) {
      return mapCalls.sources.get(id);
    }
    addLayer() {}
    getLayer() {
      return {};
    }
    fitBounds = mapCalls.fitBounds;
    getBounds() {
      return { getWest: () => -180, getEast: () => 180, getSouth: () => -90, getNorth: () => 90 };
    }
    getZoom() {
      return 6;
    }
    getCenter() {
      return { lng: -93.6, lat: 42 };
    }
    flyTo() {}
    remove() {}
  },
  Marker: class {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  },
}));
vi.mock("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url", () => ({ default: "worker" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  mapCalls.sources.clear();
});
function setup(api: MockFieldsApi) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <ApiProvider api={api}>{children}</ApiProvider>
      </QueryClientProvider>
    ),
  };
}
const request = { lon: -90.7765, lat: 44.9128, start: "2021-07-15", end: "2021-07-15" };
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
describe("polling", () => {
  it("waits 3 seconds, updates history and stops at done", async () => {
    vi.useFakeTimers();
    const api = new MockFieldsApi({ now: Date.now, latencyMs: 0 });
    const seed = await api.createJob(request);
    const get = vi.spyOn(api, "getJob");
    const { wrapper, client } = setup(api);
    const { result } = renderHook(() => useJob(seed), { wrapper });
    await advance(2999);
    expect(get).not.toHaveBeenCalled();
    await advance(1);
    expect(get).toHaveBeenCalledTimes(1);
    await advance(7000);
    expect(result.current.data?.status).toBe("done");
    expect(client.getQueryData(["jobs"])).toEqual([
      expect.objectContaining({ id: seed.id, status: "done" }),
    ]);
    const calls = get.mock.calls.length;
    await advance(30000);
    expect(get).toHaveBeenCalledTimes(calls);
  });
  it("retries a failed poll after 6 seconds without losing the job", async () => {
    vi.useFakeTimers();
    const api = new MockFieldsApi({ now: Date.now, latencyMs: 0 });
    const seed = await api.createJob(request);
    const get = vi.spyOn(api, "getJob").mockRejectedValueOnce(new NetworkError());
    const { wrapper } = setup(api);
    const { result } = renderHook(() => useJob(seed), { wrapper });
    await advance(3000);
    await advance(1);
    expect(result.current.failureCount).toBe(1);
    expect(result.current.data?.id).toBe(seed.id);
    await advance(5998);
    expect(get).toHaveBeenCalledTimes(1);
    await advance(2);
    expect(get).toHaveBeenCalledTimes(2);
    await advance(100);
    expect(result.current.data?.status).toBe("done");
  });
});
it("pasted point → done → GeoJSON source → result and history", async () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as WebGLRenderingContext);
  let clock = Date.now();
  const api = new MockFieldsApi({ now: () => clock, latencyMs: 0 }),
    { wrapper } = setup(api);
  render(<FieldsApp />, { wrapper });
  const point = await screen.findByTestId("point-input");
  await screen.findByTestId("map");
  fireEvent.paste(point, { clipboardData: { getData: () => "44.91280, -90.77650" } });
  expect((point as HTMLInputElement).value).toBe("44.91280, -90.77650");
  fireEvent.click(screen.getByTestId("submit"));
  expect(await screen.findByTestId("job-status")).toHaveTextContent("В очереди");
  clock += 8000;
  expect(await screen.findByTestId("result-fields-count", {}, { timeout: 6000 })).toHaveTextContent(
    "55",
  );
  expect(screen.getByTestId("history-item")).toHaveAttribute("data-status", "done");
  expect(screen.getByTestId("download-geojson")).toHaveAttribute(
    "href",
    expect.stringMatching(/^data:application/),
  );
  expect(mapCalls.sources.get("fields")?.setData).toHaveBeenCalledWith(
    expect.objectContaining({ type: "FeatureCollection", features: expect.any(Array) }),
  );
  expect(mapCalls.fitBounds).toHaveBeenCalled();
}, 15000);
