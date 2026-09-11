import {expect,test} from 'vitest';
import map from '../../src/data/tutorial-map.json';
import {sampleRouteOptions} from '../../src/providers/routes';
import {distanceMeters,pathLength} from '../../src/domain/geometry';
test('both tutorial directions follow connected mapped street segments, not endpoint chords',()=>{
  const segment=(a:number[],b:number[])=>[a.join(','),b.join(',')].sort().join('|');
  const streets=new Set(map.roads.flatMap(r=>r.points.slice(1).map((p,i)=>segment(r.points[i],p))));
  for(const [name,start,end] of [['AEOS','aeos','manyata'],['Manyata Tech Park','manyata','aeos']] as const){
    const routes=sampleRouteOptions(name,'three');expect(routes).toHaveLength(3);
    for(const r of routes){
      expect(r.geometryKind).toBe('offline');expect(r.path.length).toBeGreaterThan(100);
      expect(pathLength(r.path)).toBeGreaterThan(distanceMeters(r.path[0],r.path.at(-1)!)*1.3);
      expect(distanceMeters(r.path[0],{latitude:map.pins[start][0],longitude:map.pins[start][1]})).toBeLessThan(70);
      expect(distanceMeters(r.path.at(-1)!,{latitude:map.pins[end][0],longitude:map.pins[end][1]})).toBeLessThan(70);
      for(let i=1;i<r.path.length;i++)expect(streets.has(segment([r.path[i-1].latitude,r.path[i-1].longitude],[r.path[i].latitude,r.path[i].longitude]))).toBe(true);
    }
  }
  expect(map.journeys.reverse[0].nodeIds).not.toEqual([...map.journeys.forward[0].nodeIds].reverse());
});
