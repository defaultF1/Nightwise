import {expect,test} from 'vitest';
import {placePinKind,placePins,pinTint} from '../../src/maps/pins';
import type {ActivityAnalysis} from '../../src/domain/activity-types';
test('medical and fuel categories take precedence over a generic store',()=>{
 expect(placePinKind(['store','pharmacy'])).toBe('medical');
 expect(placePinKind(['store','gas_station'])).toBe('fuel');
 expect(placePinKind(['restaurant'])).toBe('shop');
 expect(placePinKind(['train_station'])).toBeUndefined();
 expect(pinTint('start').b).toBeGreaterThan(pinTint('start').r);
 expect(pinTint('destination').r).toBeGreaterThan(pinTint('destination').b);
 expect(pinTint('fuel').g).toBeGreaterThan(pinTint('fuel').r);
});
test('business pins exclude closed unknown conflicted and unlocated observations',()=>{
 const base={id:'place',categories:['pharmacy'],coordinate:{latitude:13.06,longitude:77.59},hours:{state:'open'},conflict:false};
 const analysis={places:[base,{...base,id:'closed',hours:{state:'closed'}},{...base,id:'unknown',hours:{state:'unknown'}},{...base,id:'conflict',conflict:true},{...base,id:'unlocated',coordinate:undefined}]} as unknown as ActivityAnalysis;
 expect(placePins(analysis)).toEqual([{latitude:13.06,longitude:77.59,name:'Medical listing',kind:'medical'}]);
 expect(placePins()).toEqual([]);
});
