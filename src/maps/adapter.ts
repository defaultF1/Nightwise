import { Capacitor, registerPlugin } from '@capacitor/core';
import { syncMapViewport, type Rect } from './viewport';
const MapViewport=registerPlugin<{clip(options:Rect&{id:string}):Promise<void>}>('MapViewport');
import { GoogleMap, LatLngBounds, type Polyline } from '@capacitor/google-maps';
import type { Theme } from '../theme';
import type { Coordinate } from '../domain/types';
import type { GapMarker } from '../domain/gap-markers';
import { syncNestedMapScroll } from './scroll-sync';
import { PIN_COLORS, pinTint, type PlacePin } from './pins';

export type MapLine = { id: string; path: Coordinate[]; color: string; width: number; clickable: boolean };
export type MapHandle = { draw(lines: MapLine[], pins: { name: string; latitude: number; longitude: number }[], gaps?:GapMarker[], places?: PlacePin[]): Promise<void>; fit(points: Coordinate[]): Promise<void>; touch(enabled: boolean): Promise<void>; destroy(): Promise<void> };
const latLng = (p: Coordinate) => ({ lat: p.latitude, lng: p.longitude });
let script: Promise<void> | undefined;
let instance = 0;
function loadWebMap() {
  if (script) return script;
  script = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) { reject(new Error('Map key missing')); return; }
    const w = window as typeof window & { nightwiseMapReady?: () => void; gm_authFailure?: () => void };
    const timeout = setTimeout(() => reject(new Error('Map did not load')), 18000);
    w.nightwiseMapReady = () => { clearTimeout(timeout); resolve(); };
    w.gm_authFailure = () => { clearTimeout(timeout); window.dispatchEvent(new Event('nightwise-map-auth-failed')); reject(new Error('Map access denied')); };
    const tag = document.createElement('script'); tag.async = true;
    tag.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key, callback: 'nightwiseMapReady', loading: 'async', v: 'quarterly', region: 'IN', language: 'en' })}`;
    tag.onerror = () => { clearTimeout(timeout); reject(new Error('Map connection failed')); }; document.head.append(tag);
  });
  return script;
}
function styles(theme: Theme): google.maps.MapTypeStyle[] {
  if (theme === 'light') return [{ stylers: [{ saturation: -100 }] }, { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }];
  return [
    { elementType: 'geometry', stylers: [{ color: theme === 'blue' ? '#0d2435' : '#151515' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: theme === 'blue' ? '#0d2435' : '#151515' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: theme === 'blue' ? '#b5c8d5' : '#c5c5c5' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: theme === 'blue' ? '#35556b' : '#444444' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: theme === 'blue' ? '#071621' : '#080808' }] },
    { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  ];
}
export async function createMap(element: HTMLElement, theme: Theme, onSelect: (id: string) => void, initialCenter:Coordinate={latitude:13.055,longitude:77.607}): Promise<MapHandle> {
  if (import.meta.env.VITE_ENABLE_LIVE_MAPS !== 'true') throw new Error('Maps paused');
  if (Capacitor.isNativePlatform()) {
    const mapId=`nightwise-${++instance}`;
    const map = await GoogleMap.create({ id: mapId, element, apiKey: 'configured-in-android-manifest', config: { center: { lat: initialCenter.latitude, lng: initialCenter.longitude }, zoom: 13, styles: styles(theme) } });
    let lines: string[] = [], markers: string[] = []; let ids = new Map<string, string>();
    await map.setOnPolylineClickListener(e => { const id = ids.get(e.polylineId); if (id) onSelect(id); });
    const stopScrollSync = syncNestedMapScroll(element);
    const stopViewport=syncMapViewport(element,rect=>MapViewport.clip({...rect,id:mapId}));
    return {
      async draw(next, pins, gaps=[], help=[]) {
        if (lines.length) await map.removePolylines(lines);
        if (markers.length) await map.removeMarkers(markers);
        lines = next.length ? await map.addPolylines(next.map((l): Polyline => ({ path: l.path.map(latLng), strokeColor: l.color, strokeWeight: l.width, clickable: l.clickable, tag: l.id }))) : [];
        ids = new Map(lines.map((id, i) => [id, next[i].id]));
        markers = await map.addMarkers([...pins.map((p,i) => ({ coordinate: latLng(p), title: `${i?'Destination':'Start'} · ${p.name}`, tintColor:pinTint(i?'destination':'start'),zIndex:100 })),...gaps.map(p=>({coordinate:latLng(p),title:p.label,snippet:p.name,tintColor:pinTint('gap'),zIndex:20})),...help.map(p=>({coordinate:latLng(p),title:p.name,snippet:`${p.kind==='medical'?'Medical':p.kind==='fuel'?'Fuel':'Shop'} listing · scheduled open around arrival`,iconUrl:`markers/${p.kind}.png`,iconSize:{width:18,height:18},iconAnchor:{x:0.5,y:0.5},zIndex:10}))]);
      },
      async fit(points) {
        if (!points.length) return;
        const lat = points.map(p => p.latitude), lng = points.map(p => p.longitude);
        await map.fitBounds(new LatLngBounds({ southwest: { lat: Math.min(...lat), lng: Math.min(...lng) }, northeast: { lat: Math.max(...lat), lng: Math.max(...lng) }, center: { lat: (Math.min(...lat) + Math.max(...lat)) / 2, lng: (Math.min(...lng) + Math.max(...lng)) / 2 } }), 45);
      },
      touch: enabled => enabled ? map.enableTouch() : map.disableTouch(), destroy: async () => { stopViewport();stopScrollSync(); await map.destroy(); },
    };
  }
  await loadWebMap();
  const map = new google.maps.Map(element, { center: { lat: initialCenter.latitude, lng: initialCenter.longitude }, zoom: 13, styles: styles(theme), mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: 'cooperative', clickableIcons: false });
  let lines: google.maps.Polyline[] = [], pins: google.maps.Marker[] = [];
  return {
    async draw(next, nextPins, gaps=[], help=[]) {
      lines.forEach(l => { google.maps.event.clearInstanceListeners(l); l.setMap(null); }); pins.forEach(p => p.setMap(null));
      lines = next.map(l => { const line = new google.maps.Polyline({ map, path: l.path.map(latLng), strokeColor: l.color, strokeWeight: l.width, clickable: l.clickable, zIndex: l.clickable ? 1 : 2 }); if (l.clickable) line.addListener('click', () => onSelect(l.id)); return line; });
      const icon=(kind:keyof typeof PIN_COLORS):google.maps.Symbol=>({path:'M 0,0 C -3,-5 -10,-12 -10,-20 A 10,10 0 1,1 10,-20 C 10,-12 3,-5 0,0 Z',fillColor:PIN_COLORS[kind],fillOpacity:1,strokeColor:'#ffffff',strokeWeight:1.5,scale:1,labelOrigin:new google.maps.Point(0,-20)});
      pins = nextPins.map((p, i) => new google.maps.Marker({ map, position: latLng(p), title: `${i?'Destination':'Start'} · ${p.name}`, label:{text:i?'B':'A',color:'#111111',fontWeight:'700'},icon:icon(i?'destination':'start'),zIndex:100 }));
      pins.push(...help.map(p=>new google.maps.Marker({map,position:latLng(p),title:p.name+' · '+p.kind,label:{text:p.kind==='medical'?'+':p.kind==='fuel'?'F':'S',color:'#111111',fontWeight:'700',fontSize:'10px'},icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:PIN_COLORS[p.kind],fillOpacity:1,strokeColor:'#ffffff',strokeWeight:2,labelOrigin:new google.maps.Point(0,0)},zIndex:10})));
      pins.push(...gaps.map(p=>new google.maps.Marker({map,position:latLng(p),title:p.name,label:{text:p.label,color:'#171717',fontSize:'12px',fontWeight:'600'},icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:'#f4b86a',fillOpacity:1,strokeWeight:1,labelOrigin:new google.maps.Point(0,-2.5)}})));
    },
    async fit(points) { if (points.length) { const bounds = new google.maps.LatLngBounds(); points.forEach(p => bounds.extend(latLng(p))); map.fitBounds(bounds, 45); } },
    async touch(enabled) { map.setOptions({ gestureHandling: enabled ? 'cooperative' : 'none', keyboardShortcuts: enabled }); },
    async destroy() { lines.forEach(l => l.setMap(null)); pins.forEach(p => p.setMap(null)); google.maps.event.clearInstanceListeners(map); element.replaceChildren(); },
  };
}
