import type { MapHandle, MapLine } from './adapter';
import type { Theme } from '../theme';
import type { Coordinate } from '../domain/types';
import type { GapMarker } from '../domain/gap-markers';
import { PIN_COLORS, type PlacePin } from './pins';
import { CAMERA_COLOR, type CameraPin } from './camera-pins';
import './mappls-map.css';

// Minimal boundary for the Mappls Web Maps JS SDK (vector, v3.0, static-key auth).
// Only documented constructs are used; every optional call is guarded because the
// SDK surface can differ per account plan.
type Listener = { addListener?: (event: string, handler: (e?: unknown) => void) => void };
type MapplsMap = Listener & {
  remove?: () => void; resize?: () => void; loaded?: () => boolean;
  dragPan?: { enable(): void; disable(): void }; scrollZoom?: { enable(): void; disable(): void };
  touchZoomRotate?: { enable(): void; disable(): void }; keyboard?: { enable(): void; disable(): void };
};
type MapplsSdk = {
  Map: new (id: string, options: Record<string, unknown>) => MapplsMap;
  Marker: new (options: Record<string, unknown>) => Listener;
  Polyline: new (options: Record<string, unknown>) => Listener;
  fitBounds: new (options: Record<string, unknown>) => unknown;
  remove: (options: { map: MapplsMap; layer: unknown }) => void;
  getStyles?: (callback: (styles: { name?: string }[]) => void) => unknown;
  setStyle?: (name: string) => void;
};

let script: Promise<MapplsSdk> | undefined;
let instance = 0;
function loadSdk(): Promise<MapplsSdk> {
  if (script) return script;
  script = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_MAPPLS_WEB_KEY;
    if (!key) { reject(new Error('Mappls map key missing')); return; }
    const w = window as typeof window & { mappls?: MapplsSdk };
    const fail = (message: string) => { clearInterval(poll); clearTimeout(timeout); window.dispatchEvent(new Event('nightwise-map-auth-failed')); reject(new Error(message)); };
    const timeout = setTimeout(() => fail('Mappls map did not load'), 20000);
    // The SDK defines window.mappls asynchronously after the script tag loads.
    const poll = setInterval(() => { if (typeof w.mappls?.Map === 'function') { clearInterval(poll); clearTimeout(timeout); resolve(w.mappls); } }, 150);
    const tag = document.createElement('script'); tag.async = true;
    tag.src = `https://sdk.mappls.com/map/sdk/web?${new URLSearchParams({ v: '3.0', layer: 'vector', access_token: key })}`;
    tag.onerror = () => fail('Mappls map connection failed');
    document.head.append(tag);
  });
  script.catch(() => { script = undefined; });
  return script;
}

const position = (p: Coordinate) => ({ lat: p.latitude, lng: p.longitude });
const escape = (text: string) => text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
// Best effort only: style names are account-specific, so a missing night style
// silently keeps the default map rather than failing the whole view.
function applyTheme(sdk: MapplsSdk, theme: Theme) {
  if (theme === 'light' || !sdk.getStyles || !sdk.setStyle) return;
  try {
    sdk.getStyles(styles => {
      try {
        const night = (Array.isArray(styles) ? styles : []).map(s => s?.name ?? '').find(name => /night|dark/i.test(name));
        if (night) sdk.setStyle!(night);
      } catch { /* keep the default style */ }
    });
  } catch { /* keep the default style */ }
}

export async function createMapplsMap(element: HTMLElement, theme: Theme, onSelect: (id: string) => void, center: Coordinate): Promise<MapHandle> {
  const sdk = await loadSdk();
  if (!element.id) element.id = `nightwise-map-${++instance}`;
  const map = new sdk.Map(element.id, { center: position(center), zoom: 13, zoomControl: true, location: false, fullscreenControl: false, clickableIcons: false, backgroundColor: theme === 'light' ? '#f5f5f5' : theme === 'blue' ? '#0d2435' : '#151515' });
  // Wait for the first render, but never hang: some SDK builds fire 'load'
  // before a listener can attach, so loaded() and a bounded delay also count.
  await new Promise<void>(resolve => {
    const done = () => { clearInterval(poll); clearTimeout(timeout); resolve(); };
    const timeout = setTimeout(done, 9000);
    const poll = setInterval(() => { try { if (map.loaded?.()) done(); } catch { /* not ready */ } }, 250);
    try { map.addListener?.('load', done); } catch { done(); }
  });
  applyTheme(sdk, theme);
  const resize = new ResizeObserver(() => { try { map.resize?.(); } catch { /* view gone */ } });
  resize.observe(element);
  let layers: unknown[] = [];
  const clear = () => { for (const layer of layers) try { sdk.remove({ map, layer }); } catch { /* already gone */ } layers = []; };
  const pin = (p: Coordinate, kind: keyof typeof PIN_COLORS | 'camera', text: string, name: string, status?: string) => {
    const color = kind === 'camera' ? CAMERA_COLOR : PIN_COLORS[kind];
    const marker = new sdk.Marker({ map, position: position(p), width: 27, height: 27, offset: [0, 0],
      html: `<button type="button" class="nightwise-map-pin" style="background-color:${color}" aria-label="${escape(name)}">${escape(text)}</button>`,
      popupHtml: `<strong>${escape(name)}</strong>${status ? `<p>${escape(status)}</p>` : ''}`, popupOptions: { offset: { bottom: [0, -18] } } });
    layers.push(marker);
  };
  return {
    async draw(lines: MapLine[], pins: ({ name: string } & Coordinate)[], gaps: GapMarker[] = [], places: PlacePin[] = [], cameras: CameraPin[] = []) {
      clear();
      for (const line of lines) {
        const polyline = new sdk.Polyline({ map, path: line.path.map(position), strokeColor: line.color, strokeWeight: line.width, strokeOpacity: 1, fitbounds: false });
        // Route selection by tapping the line is best effort; the route list and
        // the buttons above the map always remain available.
        if (line.clickable) try { polyline.addListener?.('click', () => onSelect(line.id)); } catch { /* selection via buttons */ }
        layers.push(polyline);
      }
      places.forEach(p => pin(p, p.kind, p.kind === 'hospital' ? 'H' : p.kind === 'medical' ? '+' : p.kind === 'fuel' ? 'F' : 'S', p.name, p.status ?? 'Listed open around arrival'));
      gaps.forEach(p => pin(p, 'gap', '!', `${p.label} · ${p.name}`));
      cameras.forEach(p => pin(p, 'camera', 'C', p.name, p.status));
      pins.forEach((p, i) => pin(p, i ? 'destination' : 'start', i ? 'B' : 'A', `${i ? 'Destination' : 'Start'} · ${p.name}`));
    },
    async fit(points) {
      if (!points.length) return;
      try { new sdk.fitBounds({ map, cType: 0, bounds: points.map(p => [p.longitude, p.latitude]), options: { padding: 45, duration: 0 } }); } catch { /* keep current view */ }
    },
    async touch(enabled) {
      for (const handler of [map.dragPan, map.scrollZoom, map.touchZoomRotate, map.keyboard]) try { enabled ? handler?.enable() : handler?.disable(); } catch { /* optional */ }
      try { map.resize?.(); } catch { /* optional */ }
    },
    async destroy() { resize.disconnect(); clear(); try { map.remove?.(); } catch { /* already gone */ } element.replaceChildren(); },
  };
}
