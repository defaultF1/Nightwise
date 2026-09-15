import type { Coordinate } from '../domain/types';
import type { Theme } from '../theme';
import type { GapMarker } from '../domain/gap-markers';
import type { PlacePin } from './pins';
import type { CameraPin } from './camera-pins';

export type MapLine = { id: string; path: Coordinate[]; color: string; width: number; clickable: boolean };
export type MapHandle = { draw(lines: MapLine[], pins: { name: string; latitude: number; longitude: number }[], gaps?:GapMarker[], places?: PlacePin[], cameras?:CameraPin[]): Promise<void>; fit(points: Coordinate[]): Promise<void>; touch(enabled: boolean, expanded?: boolean): Promise<void>; destroy(): Promise<void> };

// One Mappls web renderer serves the browser and the Android WebView alike.
// When it cannot load, LiveMap falls back to the bundled OpenStreetMap diagram.
export async function createMap(element: HTMLElement, theme: Theme, onSelect: (id: string) => void, initialCenter:Coordinate={latitude:13.055,longitude:77.607}): Promise<MapHandle> {
  if (import.meta.env.VITE_ENABLE_LIVE_MAPS !== 'true') throw new Error('Maps paused');
  const { createMapplsMap } = await import('./mappls-map');
  return createMapplsMap(element, theme, onSelect, initialCenter);
}
