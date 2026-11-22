import { Crosshair, Keyboard, Layers, Minus, Plus, Satellite, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ru as t } from "@/i18n/ru";

export type LayerName = "fields" | "cells" | "labels";
export type LayerState = Record<LayerName, boolean>;

export interface MapChromeProps {
  scenario: string | null; // the mock pill, null on the real backend
  layers: LayerState;
  layersOpen: boolean;
  legend: { fields: boolean; cells: boolean; selected: boolean };
  lat: number;
  zoom: number;
  onSearch(): void;
  onHelp(): void;
  onZoom(delta: number): void;
  onLocate(): void;
  onLayersOpen(open: boolean): void;
  onToggleLayer(name: LayerName): void;
}

/** Top bar, zoom, layers, legend and scale floating over the map. */
export function MapChrome(p: MapChromeProps) {
  const scaleKm = (80 * 156.543 * Math.cos((p.lat * Math.PI) / 180)) / 2 ** p.zoom;
  return (
    <>
      <div className="map-topbar">
        <div className="map-source glass">
          <Satellite />
          <div>
            <strong>{t.satellite}</strong>
            <small>{t.satelliteSource}</small>
          </div>
        </div>
        <div className="map-top-right">
          {p.scenario !== null && (
            <div className="mock-pill glass">
              {t.demo} · {p.scenario}
            </div>
          )}
          <Button variant="ghost" className="search-button glass" onClick={p.onSearch} aria-label={t.search}>
            <Search />
            <span>{t.search}</span>
            <kbd>⌘ K</kbd>
          </Button>
        </div>
      </div>
      <div className="map-tools">
        <div className="tool-group glass">
          <Button variant="ghost" size="icon" title={t.zoomIn} aria-label={t.zoomIn} onClick={() => p.onZoom(1)}>
            <Plus />
          </Button>
          <Button variant="ghost" size="icon" title={t.zoomOut} aria-label={t.zoomOut} onClick={() => p.onZoom(-1)}>
            <Minus />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="tool-single glass" title={t.layers} aria-label={t.layers} onClick={() => p.onLayersOpen(!p.layersOpen)}>
          <Layers />
        </Button>
        <Button variant="ghost" size="icon" className="tool-single glass" title={t.locate} aria-label={t.locate} onClick={p.onLocate}>
          <Crosshair />
        </Button>
        {p.layersOpen && (
          <div className="layers-popover glass">
            <h3>{t.layers}</h3>
            {(["fields", "cells", "labels"] as const).map((name) => (
              <label className="layer-row" key={name}>
                <span className={`swatch swatch-${name}`} />
                {name === "fields" ? t.fieldLayer : name === "cells" ? t.cellLayer : t.labels}
                <input type="checkbox" checked={p.layers[name]} onChange={() => p.onToggleLayer(name)} />
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="map-bottom">
        <div className="map-legend glass">
          {p.legend.fields && (
            <div>
              <span className="swatch swatch-fields" />
              {t.fieldLayer}
            </div>
          )}
          {p.legend.cells && (
            <div>
              <span className="swatch swatch-cells" />
              {t.cellLayer}
            </div>
          )}
          {p.legend.selected && (
            <div>
              <span className="swatch swatch-selected" />
              {t.selected}
            </div>
          )}
        </div>
        <div className="bottom-help">
          <div className="scale-block">
            {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(scaleKm)} {t.scale}
            <div className="scale-line" />
          </div>
          <Button variant="ghost" size="icon" className="tool-single glass" aria-label={t.shortcuts} title={t.shortcuts} onClick={p.onHelp}>
            <Keyboard />
          </Button>
        </div>
      </div>
    </>
  );
}
