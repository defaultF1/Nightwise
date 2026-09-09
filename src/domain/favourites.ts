import { inBengaluru, type JourneyPoint } from './journey';
export type Favourite = { id: string; label: string; placeId?: string; point?: JourneyPoint };
const key = 'nightwise.favourites.v1';
export function readFavourites(): Favourite[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((p): p is Favourite => !!p && typeof p.id === 'string' && typeof p.label === 'string' && p.label.length > 0 && p.label.length <= 60 &&
      (typeof p.placeId === 'string' && /^[\w-]{1,200}$/.test(p.placeId) || !!p.point && typeof p.point.name === 'string' && inBengaluru(p.point))).slice(0,20);
  } catch { return []; }
}
export function makeFavourite(label: string, point: JourneyPoint): Favourite {
  if (!label.trim() || label.trim().length > 60 || !inBengaluru(point)) throw new Error('Enter a label and choose a Bengaluru pin.');
  // Persist Google place IDs and the user's own label, never Google's addresses or coordinates.
  return { id: crypto.randomUUID(), label: label.trim(), ...(point.placeId ? { placeId: point.placeId } : { point: { name: label.trim(), latitude: point.latitude, longitude: point.longitude } }) };
}
export function writeFavourites(rows: Favourite[]) { localStorage.setItem(key, JSON.stringify(rows.slice(0,20))); }
