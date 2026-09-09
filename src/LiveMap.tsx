import { useEffect, useRef, useState, createElement } from 'react';
import { Capacitor } from '@capacitor/core';
import { MapPin } from 'lucide-react';
import type { Route } from './domain/types';
import type { ActivityAnalysis } from './domain/activity-types';
import type { LiveJourney } from './domain/journey';
import type { Theme } from './theme';
import { createMap, type MapHandle, type MapLine } from './maps/adapter';
import { samplePolyline } from './domain/geometry';
import { gapMarkers } from './domain/gap-markers';

export function LiveMap({ routes, selectedId, onSelect, journey, theme, blocked, analysis }: { routes: Route[]; selectedId?: string; onSelect: (id: string) => void; journey: LiveJourney; theme: Theme; blocked: boolean; analysis?: ActivityAnalysis }) {
  const element = useRef<HTMLElement>(null);
  const handle = useRef<MapHandle | null>(null);
  const queue = useRef(Promise.resolve());
  const select = useRef(onSelect); select.current = onSelect;
  const [ready, setReady] = useState(false), [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false; let owned: MapHandle | undefined;
    setError(false);
    const failed = () => setError(true);
    window.addEventListener('nightwise-map-auth-failed', failed);
    // Queue creation/destruction so StrictMode or a quick Back cannot orphan a native view.
    queue.current = queue.current.then(async () => {
      if (disposed || !element.current) return;
      try {
        owned = await createMap(element.current, theme, id => select.current(id));
        if (disposed) { await owned.destroy(); owned = undefined; return; }
        handle.current = owned; setReady(true);
        if (Capacitor.isNativePlatform()) document.documentElement.dataset.nativeMap = 'true';
      } catch { if (!disposed) setError(true); }
    });
    return () => {
      disposed = true; handle.current = null; setReady(false); delete document.documentElement.dataset.nativeMap;
      window.removeEventListener('nightwise-map-auth-failed', failed);
      queue.current = queue.current.then(async () => { await owned?.destroy(); }).catch(() => {});
    };
    // Recreate for an appearance change; route-card selection reuses the map.
  }, [theme]);
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current.then(async () => {
      const map = handle.current; if (!map) return;
      const selected = routes.find(r => r.id === selectedId);
      const lines: MapLine[] = [...routes.filter(r => r.id !== selectedId), ...routes.filter(r => r.id === selectedId)].map(r => ({ id: r.id, path: r.path, color: r.id === selectedId ? theme === 'blue' ? '#30dcc6' : theme === 'light' ? '#131313' : '#eeeeee' : '#8293a0', width: r.id === selectedId ? 6 : 4, clickable: true }));
      if (selected && analysis?.source === 'live') {
        const samples = samplePolyline(selected.path, 200, 120);
        for (const [i, segment] of analysis.segments.entries()) if (segment.state !== 'active' && samples[i + 1]) lines.push({ id: selected.id, path: [samples[i].coordinate, samples[i + 1].coordinate], color: segment.state === 'low' ? '#f4b86a' : '#bbc3ca', width: 7, clickable: false });
      }
      await map.draw(lines, [journey.origin, journey.destination], selected&&analysis?.source==='live'?gapMarkers(selected,analysis):[]);
    }).catch(() => setError(true));
  }, [ready, routes, selectedId, journey, analysis, theme]);
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current.then(async () => { await handle.current?.fit(routes.length ? routes.flatMap(r => r.path) : [journey.origin, journey.destination]); }).catch(() => setError(true));
  }, [ready, routes, journey]);
  useEffect(() => { if (ready) queue.current = queue.current.then(async () => { await handle.current?.touch(!blocked); }).catch(() => {}); }, [ready, blocked]);
  return <section className="live-map" aria-label="Bengaluru Google map">
    <div className="diagram-heading"><span><MapPin size={14} /> Bengaluru</span><span className="sample-badge">Google map</span></div>
    <div className="map-slot">{createElement('capacitor-google-map', { ref: element, className: 'map-canvas' })}
      {(!ready || error) && <div className="map-cover" role="status">{import.meta.env.VITE_ENABLE_LIVE_MAPS !== 'true' ? 'Live maps are paused while billing is pending. Tutorial mode remains available.' : error ? 'Map unavailable. Check connection, key restrictions and billing. Route details remain available.' : 'Loading Bengaluru map…'}</div>}
      {blocked && <div className="map-curtain" />}
    </div>
    <div className="diagram-endpoints"><span><b>A</b> {journey.origin.name}</span><span><b>B</b> {journey.destination.name}</span></div>
    <p className="diagram-caption">Pan and zoom across Bengaluru. {routes.length ? 'Choose a route on the map or below.' : 'The pins come from the supplied locations; no route is drawn yet.'}</p>
    {analysis && <p className="map-legend">{theme === 'blue' ? 'Teal' : theme === 'light' ? 'Black' : 'White'}: selected route · Amber: observed low activity · Grey: unknown. Estimated between samples.</p>}
  </section>;
}
