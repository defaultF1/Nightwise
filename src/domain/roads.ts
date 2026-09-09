import type { Coordinate, Route } from './types';
import { distanceMeters, interpolate, pathLength } from './geometry';

export type RoadClass = 'main' | 'internal' | 'unknown';
export type RoadWay = { id: number; highway: string; path: Coordinate[]; gradeSeparated?: boolean };
export type RoadAnalysis = {
  source: 'openstreetmap'; status: 'estimated' | 'insufficient' | 'unavailable';
  mainMeters: number; internalMeters: number; unknownMeters: number; coverage: number;
  mainRoadFraction?: number; internalRoadFraction?: number; snapshotDate?: string;
  internalTurns?:number; unknownTurns?:number; internalTurnsPerKm?:number;
};
const MAIN = new Set(['motorway','trunk','primary','secondary','tertiary','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link']);
const INTERNAL = new Set(['residential','living_street','service']);
export const roadClass = (tag: string): RoadClass => MAIN.has(tag) ? 'main' : INTERNAL.has(tag) ? 'internal' : 'unknown';
const xy = (p: Coordinate) => ({ x: p.longitude * 108420, y: p.latitude * 111195 });
type Segment = { a: ReturnType<typeof xy>; b: ReturnType<typeof xy>; kind: RoadClass; grade: boolean; way: number };
const cell = (x: number, y: number) => `${Math.floor(x/100)}:${Math.floor(y/100)}`;

export function createRoadAnalyzer(ways: RoadWay[], snapshotDate?: string) {
  const grid = new Map<string, Set<Segment>>();
  for (const way of ways) for (let i=1; i<way.path.length; i++) {
    const a=xy(way.path[i-1]), b=xy(way.path[i]);
    if (Math.hypot(b.x-a.x,b.y-a.y)<0.1 || Math.hypot(b.x-a.x,b.y-a.y)>5000) continue;
    const s: Segment={a,b,kind:roadClass(way.highway),grade:!!way.gradeSeparated,way:way.id};
    for(let x=Math.floor(Math.min(a.x,b.x)/100);x<=Math.floor(Math.max(a.x,b.x)/100);x++)
      for(let y=Math.floor(Math.min(a.y,b.y)/100);y<=Math.floor(Math.max(a.y,b.y)/100);y++) {
        const key=`${x}:${y}`; if(!grid.has(key))grid.set(key,new Set()); grid.get(key)!.add(s);
      }
  }
  function match(point: Coordinate, from: Coordinate, to: Coordinate): RoadClass {
    const p=xy(point), a=xy(from), b=xy(to), vx=b.x-a.x, vy=b.y-a.y;
    const candidates = new Set<Segment>();
    for(const dx of [-20,0,20]) for(const dy of [-20,0,20]) for(const s of grid.get(cell(p.x+dx,p.y+dy))||[]) candidates.add(s);
    const matches: {distance:number; kind:RoadClass; grade:boolean; way:number}[]=[];
    for(const s of candidates) {
      const ux=s.b.x-s.a.x, uy=s.b.y-s.a.y, len2=ux*ux+uy*uy;
      const t=Math.max(0,Math.min(1,((p.x-s.a.x)*ux+(p.y-s.a.y)*uy)/len2));
      const distance=Math.hypot(p.x-s.a.x-t*ux,p.y-s.a.y-t*uy);
      const alignment=Math.abs((vx*ux+vy*uy)/(Math.hypot(vx,vy)*Math.sqrt(len2)));
      if(distance<=15 && alignment>=Math.cos(25*Math.PI/180)) matches.push({distance,kind:s.kind,grade:s.grade,way:s.way});
    }
    matches.sort((a,b)=>a.distance-b.distance);
    const best=matches[0]; if(!best || best.grade)return 'unknown';
    // A parallel service road or an unresolved elevation cannot be assigned by proximity alone.
    if(matches.some(m=>m.way!==best.way && m.distance<=best.distance+8 && (m.kind!==best.kind||m.grade)))return 'unknown';
    return best.kind;
  }
  return (path: Coordinate[], steps?:Route['steps']): RoadAnalysis => {
    const length=pathLength(path); const totals={main:0,internal:0,unknown:0};
    if(length>30000 || path.length>4000)throw new Error('Road analysis exceeds the pilot geometry limit');
    for(let i=1;i<path.length;i++) {
      const meters=distanceMeters(path[i-1],path[i]); const pieces=Math.max(1,Math.ceil(meters/40));
      for(let j=0;j<pieces;j++) totals[match(interpolate(path[i-1],path[i],(j+.5)/pieces),path[i-1],path[i])]+=meters/pieces;
    }
    const coverage=length ? (totals.main+totals.internal)/length : 0;
    let turnEvidence:Pick<RoadAnalysis,'internalTurns'|'unknownTurns'|'internalTurnsPerKm'>={};
    if(steps?.length&&steps.every(s=>typeof s.maneuver==='string')){
      let internalTurns=0,unknownTurns=0;
      for(const step of steps.filter(s=>/TURN|U_TURN|ROUNDABOUT/.test(s.maneuver!))){
        const points=step.path;
        const next=points?.findIndex((p,i)=>i>0&&distanceMeters(points[0],p)>1)??-1;
        if(!points||next<1){unknownTurns++;continue;}
        const a=points[0],b=points[next];
        const point=interpolate(a,b,Math.min(.5,10/distanceMeters(a,b)));
        const kind=match(point,a,b);
        if(kind==='internal')internalTurns++;else if(kind==='unknown')unknownTurns++;
      }
      turnEvidence={internalTurns,unknownTurns,...(unknownTurns===0&&length>0?{internalTurnsPerKm:internalTurns/(length/1000)}:{})};
    }
    return {source:'openstreetmap',status:!grid.size?'unavailable':coverage>=.95?'estimated':'insufficient',mainMeters:totals.main,internalMeters:totals.internal,unknownMeters:totals.unknown,coverage,snapshotDate,
      ...turnEvidence,...(coverage>=.95 ? {mainRoadFraction:totals.main/length,internalRoadFraction:totals.internal/length} : {})};
  };
}
