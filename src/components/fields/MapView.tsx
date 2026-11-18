import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as LibreMap } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { MapHandle, MapProps } from './map-types';
import { ru, formatArea, formatDate } from '@/i18n/ru';
import type { ResultMeta } from '@/services/api/types';
import { AlertTriangle } from 'lucide-react';
maplibregl.setWorkerUrl(workerUrl);
const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const MapView = forwardRef<MapHandle, MapProps>(function MapView(props, ref) {
  const container = useRef<HTMLDivElement>(null), map = useRef<LibreMap | null>(null), marker = useRef<maplibregl.Marker | null>(null), callbacks = useRef(props);
  callbacks.current = props;
  const [unavailable, setUnavailable] = useState(false);
  const pending = useRef<{ meta: ResultMeta; fields: GeoJSON.FeatureCollection } | null>(null);
  const fit = (geometry: GeoJSON.Polygon) => { const points = geometry.coordinates.flat(); map.current?.fitBounds([[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]], { padding: window.innerWidth < 768 ? { top: 100, bottom: 330, left: 35, right: 70 } : { top: 130, bottom: 110, left: 450, right: 160 }, duration: 900, maxZoom: 13 }); };
  const result = (meta: ResultMeta, fields: GeoJSON.FeatureCollection) => { const m = map.current; if (!m?.getSource('fields')) { pending.current = { meta, fields }; return; } (m.getSource('fields') as GeoJSONSource).setData(fields); (m.getSource('current-cell') as GeoJSONSource).setData({ type: 'Feature', properties: {}, geometry: meta.cell_geom }); fit(meta.cell_geom); };
  useImperativeHandle(ref, () => ({
    placeMarker(p, fly = false) { const m = map.current; if (!m) return; if (!marker.current) { const el = document.createElement('div'); el.className = 'point-marker'; marker.current = new maplibregl.Marker({ element: el }).setLngLat([p.lon,p.lat]).addTo(m); } else marker.current.setLngLat([p.lon,p.lat]); if (fly) m.flyTo({ center: [p.lon,p.lat], zoom: Math.max(12,m.getZoom()), duration: 1100 }); },
    showResult: result,
    showCells(results) { const m = map.current; if (!m?.getSource('cells')) return; (m.getSource('cells') as GeoJSONSource).setData({ type: 'FeatureCollection', features: (results ?? []).map(r => ({ type: 'Feature', properties: { id: r.id, label: `${r.cell} · ${formatDate(r.scene_date,true)} · ${r.n_fields ?? '—'} ${ru.fields}` }, geometry: r.cell_geom })) }); (m.getSource('cell-labels') as GeoJSONSource).setData({ type: 'FeatureCollection', features: (results ?? []).map(r => { const p = r.cell_geom.coordinates[0]; return { type: 'Feature', properties: { label: `${r.cell} · ${formatDate(r.scene_date,true)} · ${r.n_fields ?? '—'} ${ru.fields}` }, geometry: { type: 'Point', coordinates: [(p[0][0]+p[1][0])/2,p[2][1]] } }; }) }); },
    fitTo: fit, zoom(delta) { map.current?.zoomTo((map.current?.getZoom() ?? 6) + delta); },
    setLayer(name, visible) { const ids = name === 'fields' ? ['fields-fill','fields-line'] : name === 'cells' ? ['cells-fill','cells-line','cells-label'] : ['labels']; ids.forEach(id => { if (map.current?.getLayer(id)) map.current.setLayoutProperty(id,'visibility',visible ? 'visible' : 'none'); }); },
  }));
  useEffect(() => {
    const canvas = document.createElement('canvas');
    if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) { setUnavailable(true); return; }
    if (!container.current) return;
    const css = getComputedStyle(document.documentElement), color = (token: string) => css.getPropertyValue(token).trim();
    const m = new maplibregl.Map({ container: container.current, center: [-93.6,42], zoom: 6, attributionControl: { compact: true }, style: { version: 8, glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf', sources: {
      imagery: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
      labels: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 },
    }, layers: [{ id: 'imagery', type: 'raster', source: 'imagery', paint: { 'raster-saturation': -.22, 'raster-brightness-max': .83 } }, { id: 'labels', type: 'raster', source: 'labels' }] } });
    map.current = m;
    m.on('load', () => {
      ['fields','current-cell','cells','cell-labels'].forEach(id => m.addSource(id,{ type: 'geojson', data: empty, ...(id === 'fields' ? { generateId: true } : {}) }));
      m.addLayer({ id: 'cells-fill', type: 'fill', source: 'cells', minzoom: 7, paint: { 'fill-color': color('--map-cells'), 'fill-opacity': .07 } });
      m.addLayer({ id: 'cells-line', type: 'line', source: 'cells', minzoom: 7, paint: { 'line-color': color('--map-cells'), 'line-width': 1.5, 'line-dasharray': [3,2] } });
      m.addLayer({ id: 'cells-label', type: 'symbol', source: 'cell-labels', minzoom: 7, layout: { 'text-field': ['get','label'], 'text-font': ['Open Sans Regular'], 'text-size': 11, 'text-anchor': 'bottom', 'text-offset': [0,-.7] }, paint: { 'text-color': color('--map-cells'), 'text-halo-color': color('--map-scrim'), 'text-halo-width': 2 } });
      m.addLayer({ id: 'fields-fill', type: 'fill', source: 'fields', paint: { 'fill-color': color('--map-fields'), 'fill-opacity': ['case',['boolean',['feature-state','hover'],false],.5,.22] } });
      m.addLayer({ id: 'fields-line', type: 'line', source: 'fields', paint: { 'line-color': color('--map-fields'), 'line-width': 1.5 } });
      m.addLayer({ id: 'current-line', type: 'line', source: 'current-cell', paint: { 'line-color': color('--map-selected'), 'line-width': 2, 'line-dasharray': [4,2] } });
      if (pending.current) { result(pending.current.meta,pending.current.fields); pending.current = null; }
      callbacks.current.onReady(); bounds();
    });
    let hover: string | number | undefined;
    m.on('mousemove', e => { callbacks.current.onCursor({ lon: e.lngLat.lng, lat: e.lngLat.lat },m.getZoom()); if (!m.getLayer('fields-fill')) return; const features = m.queryRenderedFeatures(e.point,{ layers: ['fields-fill'] }); if (hover !== undefined) m.setFeatureState({ source: 'fields', id: hover },{ hover: false }); hover = features[0]?.id; if (hover !== undefined) m.setFeatureState({ source: 'fields', id: hover },{ hover: true }); m.getCanvas().style.cursor = features.length ? 'pointer' : 'crosshair'; });
    m.on('click', e => { const field = m.getLayer('fields-fill') ? m.queryRenderedFeatures(e.point,{ layers: ['fields-fill'] })[0] : null; if (field) { const node = document.createElement('div'); node.className = 'field-popup'; node.textContent = formatArea(Number(field.properties.area_ha)); new maplibregl.Popup({ closeButton: false, offset: 12 }).setLngLat(e.lngLat).setDOMContent(node).addTo(m); return; } const cell = m.getLayer('cells-fill') ? m.queryRenderedFeatures(e.point,{ layers: ['cells-fill'] })[0] : null; if (cell) { callbacks.current.onResult(Number(cell.properties.id)); return; } callbacks.current.onPoint({ lon: e.lngLat.lng, lat: e.lngLat.lat }); });
    function bounds() { const b = m.getBounds(); callbacks.current.onBounds([b.getWest(),b.getSouth(),b.getEast(),b.getNorth()]); callbacks.current.onCursor({ lon: m.getCenter().lng,lat:m.getCenter().lat },m.getZoom()); }
    m.on('moveend',bounds);
    return () => { marker.current?.remove(); marker.current = null; m.remove(); map.current = null; };
  }, []);
  return <div className="map-host" data-testid="map" ref={container}>{unavailable && <div className="webgl-notice glass"><AlertTriangle /><h2>{ru.webgl}</h2><p>{ru.webglHelp}</p></div>}</div>;
});
export default MapView;
