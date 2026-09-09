import { AEOS_PIN, MANYATA_PIN, type JourneyPoint } from './journey';
export type PlaceSuggestion = { id: string; title: string; address: string };
const pins=[{point:AEOS_PIN,aliases:'aeos office sahakar sahakara shahakar nagar'}, {point:MANYATA_PIN,aliases:'manyata manayata manyatha tech park embassy'}];
const normalize=(value:string)=>value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function searchKnownPins(query:string):JourneyPoint[]{
  const tokens=normalize(query).split(' ').filter(Boolean);
  return pins.filter(p=>tokens.every(t=>normalize(p.point.name+' '+p.aliases).includes(t))).map(p=>p.point);
}
