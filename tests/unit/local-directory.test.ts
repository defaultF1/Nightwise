import {expect,test} from 'vitest';
import {distanceToRoute,distinctRoadShare} from '../../src/domain/route-proximity';
import {directoryAlongRoute,directoryPins,type Directory} from '../../src/domain/local-directory';
import type {Route} from '../../src/domain/types';
import {Geoapify} from '../../server/geoapify';
import {vi} from 'vitest';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';

const path=[{latitude:13.05,longitude:77.60},{latitude:13.06,longitude:77.60}];
const route:Route={id:'one',label:'Fastest',source:'geoapify',geometryKind:'provider',path,distanceMeters:1112,durationSeconds:180};
const directory:Directory={savedAt:'2026-09-15T12:00:00Z',attribution:'OSM',places:[{id:'one',name:'Fuel',kind:'fuel',latitude:13.055,longitude:77.6001,sourceUrl:'https://www.openstreetmap.org/node/1'},{id:'two',name:'Far',kind:'shop',latitude:13.055,longitude:77.61,sourceUrl:'https://www.openstreetmap.org/node/2'}]};
test('directory filters the actual road shape, including reverse travel, without leaking into Google mode',()=>{
 expect(distanceToRoute({latitude:13.055,longitude:77.60},path)).toBeCloseTo(0);
 expect(directoryAlongRoute(directory,route).map(p=>p.id)).toEqual(['one']);
 expect(directoryAlongRoute(directory,{...route,path:[...path].reverse()})).toHaveLength(1);
 expect(directoryAlongRoute(directory,{...route,source:'google'})).toEqual([]);
});
test('saved unknown hours stay unknown; matching live markers are not duplicated',()=>{
 const rows=directoryAlongRoute(directory,route);
 expect(directoryPins(rows,directory.savedAt,[])[0].status).toContain('Opening hours unknown');
 expect(directoryPins(rows,directory.savedAt,[])[0].status).toContain('Current opening is not confirmed');
 expect(directoryPins(rows,directory.savedAt,[{name:'FUEL',kind:'fuel',latitude:13.055,longitude:77.6001}])).toEqual([]);
});
test('substantially overlapping candidates are distinguished from other road corridors',()=>{
 expect(distinctRoadShare(path,[...path].reverse())).toBe(0);
 expect(distinctRoadShare(path,path.map(p=>({...p,longitude:p.longitude+.003})))).toBe(1);
 expect(distinctRoadShare(path,path.map(p=>({...p,longitude:p.longitude+.0001})))).toBe(0);
});
test('healthcare and fuel are searched separately so a combined result cannot omit a help category',async()=>{
 const provider=new Geoapify('test-key-unused');
 const requests=vi.spyOn(provider,'request').mockResolvedValue({features:[]});
 await provider.scans({queries:[{id:'a',coordinate:DEFAULT_JOURNEY.origin}],routes:{}} as any,new AbortController().signal);
 const categories=requests.mock.calls.map(c=>c[1].categories);
 expect(categories).toContain('healthcare');expect(categories).toContain('service.vehicle.fuel');
 expect(categories).not.toContain('healthcare,service.vehicle.fuel,accommodation,public_transport');
 requests.mockRestore();
});
