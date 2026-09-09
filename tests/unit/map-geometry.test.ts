import {expect,test} from 'vitest';
import {distanceMeters,pathLength,slicePolyline} from '../../src/domain/geometry';
const path=[{latitude:13,longitude:77.6},{latitude:13.001,longitude:77.6},{latitude:13.001,longitude:77.601},{latitude:13.002,longitude:77.601}];
test('coverage overlay retains the road corners between sample positions',()=>{
 const slice=slicePolyline(path,50,pathLength(path)-50);
 expect(slice).toHaveLength(4);expect(slice[1]).toEqual(path[1]);expect(slice[2]).toEqual(path[2]);
 expect(pathLength(slice)).toBeCloseTo(pathLength(path)-100,2);
 expect(pathLength(slice)).toBeGreaterThan(distanceMeters(slice[0],slice.at(-1)!));
});
test('point positions and clamped intervals remain on the provider polyline',()=>{
 expect(slicePolyline(path,-10,10000)).toEqual(path);
 const point=slicePolyline(path,50,50);expect(point).toHaveLength(1);expect(point[0].longitude).toBeCloseTo(77.6,7);
 expect(()=>slicePolyline(path,200,100)).toThrow('Invalid route interval');
});
