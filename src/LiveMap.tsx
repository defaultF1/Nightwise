import directoryData from './data/aeos-manyata-directory.json';
import {directoryAlongRoute,directoryPins,type Directory} from './domain/local-directory';
import { usesGeoapify } from './providers/selection';
import { useEffect, useMemo, useRef, useState, createElement } from 'react';
import { Capacitor } from '@capacitor/core';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { useExpandedMap } from './maps/use-expanded-map';
import type { Route } from './domain/types';
import type { ActivityAnalysis } from './domain/activity-types';
import { regionForPoint, type LiveJourney } from './domain/journey';
import type { Theme } from './theme';
import { createMap, type MapHandle, type MapLine } from './maps/adapter';
import { slicePolyline } from './domain/geometry';
import { gapMarkers } from './domain/gap-markers';
import { visiblePlacePins, pinsNearRoute, PIN_COLORS } from './maps/pins';
import { camerasNearRoute, mappedCameraPins, MAPPED_CAMERA_DISTANCE_METERS, CAMERA_DATA_TIMESTAMP } from './domain/camera-layer';
import type { LiveResult } from './domain/live-contract';
import {PLACE_GROUPS,groupCounts,groupSummary} from './domain/category-counts';

let nativeMapOwners = 0;

export function LiveMap({ routes, selectedId, onSelect, journey, theme, blocked, analysis, activityStatus }: { routes: Route[]; selectedId?: string; onSelect: (id: string) => void; journey: LiveJourney; theme: Theme; blocked: boolean; analysis?: ActivityAnalysis; activityStatus?:LiveResult['activityStatus'] }) {
  const city=regionForPoint(journey.origin)?.city??'Bengaluru';
  const {expanded,setExpanded,container,toggle}=useExpandedMap();
  const element = useRef<HTMLElement>(null);
  const handle = useRef<MapHandle | null>(null);
  const queue = useRef(Promise.resolve());
  const select = useRef(onSelect); select.current = onSelect;
  const [ready, setReady] = useState(false), [error, setError] = useState(false);
  const selectedRoute=routes.find(r=>r.id===selectedId);
  const routeAnalysis=analysis?.routeId===selectedId?analysis:undefined;
  const placeMarkers=visiblePlacePins(routeAnalysis,60,false,usesGeoapify?selectedRoute?.path:undefined);
  const directory=directoryData as Directory;
  const localRows=usesGeoapify?directoryAlongRoute(directory,selectedRoute):[];
  const localPins=selectedRoute?pinsNearRoute(directoryPins(localRows,directory.savedAt,placeMarkers),selectedRoute.path):[];
  const mappedCameras=useMemo(()=>usesGeoapify&&selectedRoute?camerasNearRoute(selectedRoute.path):[],[selectedRoute]);
  useEffect(() => {
    let disposed = false; let owned: MapHandle | undefined; let nativeOwner = false;
    setError(false);
    const failed = () => setError(true);
    window.addEventListener('nightwise-map-auth-failed', failed);
    // Queue creation/destruction so StrictMode or a quick Back cannot orphan a native view.
    queue.current = queue.current.then(async () => {
      if (disposed || !element.current) return;
      try {
        owned = await createMap(element.current, theme, id => select.current(id),journey.origin);
        if (disposed) { await owned.destroy(); owned = undefined; return; }
        handle.current = owned; setReady(true);
        if (Capacitor.isNativePlatform()&&!usesGeoapify) { nativeOwner = true; nativeMapOwners++; document.documentElement.dataset.nativeMap = 'true'; }
      } catch { if (!disposed) setError(true); }
    });
    return () => {
      disposed = true; handle.current = null; setReady(false);
      if (nativeOwner) { nativeOwner = false; if (--nativeMapOwners === 0) delete document.documentElement.dataset.nativeMap; }
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
      if (selected && routeAnalysis?.source === 'live') {
        for (const segment of routeAnalysis.segments) if (segment.state !== 'active') {
          const path = slicePolyline(selected.path, segment.fromMeters, segment.toMeters);
          if (path.length > 1) lines.push({ id: selected.id, path, color: segment.state === 'low' ? theme==='light'?'#a8600a':'#f4b86a' : theme==='light'?'#72828d':'#bbc3ca', width: 4, clickable: false });
        }
      }
      await map.draw(lines, [journey.origin, journey.destination], selected&&routeAnalysis?.source==='live'?gapMarkers(selected,routeAnalysis):[], [...placeMarkers,...localPins,...mappedCameraPins(mappedCameras)]);
    }).catch(() => setError(true));
  }, [ready, routes, selectedId, journey, analysis, theme, mappedCameras]);
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current.then(async () => { await handle.current?.fit([...routes.flatMap(r => r.path),journey.origin,journey.destination]); }).catch(() => setError(true));
  }, [ready, routes, journey]);
  useEffect(() => { if (ready) queue.current = queue.current.then(async () => { await handle.current?.touch(!blocked, expanded); }).catch(() => {}); }, [ready, blocked, expanded]);
  return <section ref={container} className={`live-map${expanded?' map-expanded':''}`} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label={`${city} ${usesGeoapify?'street':'Google'} map`}>
    <div className="diagram-heading"><span><MapPin size={14} /> {city}</span><button ref={toggle} className="map-size-button" type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>} {expanded?'Minimize map':'Full screen'}</button></div>
    {routes.length>0&&<div className="map-route-options" role="group" aria-label="Choose route on map">{routes.map(route=><button key={route.id} aria-pressed={route.id===selectedId} onClick={()=>onSelect(route.id)}>{route.label} · {Math.round(route.durationSeconds/60)} min</button>)}</div>}
    <div className="map-slot">{createElement(usesGeoapify?'div':'capacitor-google-map', { ref: element, className: 'map-canvas' })}
      {(!ready || error) && <div className="map-cover" role="status">{!usesGeoapify&&import.meta.env.VITE_ENABLE_LIVE_MAPS !== 'true' ? 'Live maps are paused to control usage. Tutorial mode remains available.' : error ? 'Map unavailable. Check connection, key restrictions and billing. Route details remain available.' : `Loading ${city} map…`}</div>}
      {blocked && <div className="map-curtain" />}
    </div>
    <div className="diagram-endpoints"><span><b>A</b> {journey.origin.name}</span><span><b>B</b> {journey.destination.name}</span></div>
    {!routes.length&&<p className="diagram-caption">Endpoint preview. Confirm your journey to load routes along roads.</p>}
    <div className="pin-legend" aria-label="Map pin colours">{((routes.length?[['start','Start / current location'],['destination','Destination'],['shop','Shops'],['medical','Pharmacies / clinics'],['hospital','Hospitals'],['fuel','Petrol / CNG'],['camera','Mapped cameras (OSM)']]:[['start','Start / current location'],['destination','Destination']]) as readonly (readonly [keyof typeof PIN_COLORS,string])[]).map(([kind,label])=><span key={kind}><i style={{backgroundColor:PIN_COLORS[kind]}}/>{label}</span>)}</div>
    {routes.length>0&&<div className="map-place-controls">
      {usesGeoapify&&selectedRoute&&<div className="camera-layer"><h3><i style={{backgroundColor:PIN_COLORS.camera}}/> Mapped cameras <span>{mappedCameras.length}</span></h3><p>{mappedCameras.length?`Listed within ${MAPPED_CAMERA_DISTANCE_METERS} m of this route.`:'None listed within 60 m of this route.'}</p><small>OpenStreetMap · {CAMERA_DATA_TIMESTAMP.slice(0,10)}. Locations are mapped; operation is not verified.</small></div>}
      {analysis&&<ul aria-label="Places along this route">{PLACE_GROUPS.map(group=>{const count=groupCounts(analysis,group.categories);return count.total?<li key={group.id}><strong>{group.label}</strong> · {groupSummary(count)}</li>:null;})}</ul>}
      {usesGeoapify&&<p className="settings-helper">Pins show places within 50 m of the selected route, at their listed locations. Nearby counts include a wider area; entrances may require a detour.</p>}
      {!placeMarkers.length&&<p>{activityStatus==='budget'?'Place scans could not run because the service search allowance is used up.':activityStatus==='disabled'?'Place scans are switched off.':usesGeoapify?'No open or estimated-open listings were returned close enough to this route to show as live pins.':'No returned places are open or estimated open when you pass. Missing listings do not mean this road is empty.'}</p>}

    </div>}
  </section>;
}
