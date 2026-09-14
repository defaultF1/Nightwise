import {expect,test} from 'vitest';
import {assumedShopHours} from '../../src/domain/assumed-hours';
import {groupCounts,groupSummary} from '../../src/domain/category-counts';
import {visiblePlacePins} from '../../src/maps/pins';
import type {ActivityAnalysis,DeduplicatedPlace} from '../../src/domain/activity-types';
const place=(category:string):DeduplicatedPlace=>({id:category,categories:[category],coordinate:{latitude:13.06,longitude:77.59},sampleIndexes:[0],conflict:false,hours:{state:'unknown',closingSoon:false,minutesUntilClose:null,reason:'Google did not return usable opening and closing times.'}});
const at=(time:string)=>`2026-09-14T${time}:00+05:30`;
test.each([
 ['store','08:59',false],['store','09:00',true],['store','19:59',true],['store','20:00',false],
 ['pharmacy','09:59',false],['pharmacy','10:00',true],['drugstore','22:59',true],['pharmacy','23:00',false],
 ['gas_station','00:00',true],['gas_station','23:59',true],
] as const)('%s fallback at %s is open=%s',(category,time,open)=>{
 expect(assumedShopHours(place(category),at(time))?.open).toBe(open);
});
test('uses passing time, including a date boundary',()=>{
 expect(assumedShopHours({...place('store'),arrivalMinutes:2},at('19:59'))?.open).toBe(false);
 expect(assumedShopHours({...place('pharmacy'),arrivalMinutes:2},at('23:59'))?.open).toBe(false);
 expect(assumedShopHours({...place('gas_station'),arrivalMinutes:2},at('23:59'))?.open).toBe(true);
});
test('does not overwrite real closures or invent hours for hospitals, conflicts or stale data',()=>{
 const p=place('gas_station');
 expect(assumedShopHours({...p,hours:{...p.hours,state:'closed',basis:'current'}},at('12:00'))).toBeNull();
 expect(assumedShopHours({...p,conflict:true},at('12:00'))).toBeNull();
 expect(assumedShopHours({...p,hours:{...p.hours,reason:'These opening hours need a fresh check.'}},at('12:00'))).toBeNull();
 expect(assumedShopHours(place('hospital'),at('12:00'))).toBeNull();
 expect(assumedShopHours(place('bus_station'),at('12:00'))).toBeNull();
 expect(assumedShopHours(p,'invalid')).toBeNull();
});
test('counts and markers agree; refreshed Google hours replace the estimate',()=>{
 const p=place('gas_station');
 const a={checkedAt:at('12:00'),places:[p]} as ActivityAnalysis;
 expect(groupCounts(a,['gas_station'])).toMatchObject({total:1,open:0,unknown:0,estimatedOpen:1});
 expect(groupSummary(groupCounts(a,['gas_station']))).toBe('1 found · 1 estimated open');
 expect(visiblePlacePins(a,60,false)[0].status).toContain('Estimated open');
 const fresh={...a,places:[{...p,hours:{...p.hours,state:'closed' as const,basis:'current' as const}}]};
 expect(groupCounts(fresh,['gas_station'])).toMatchObject({total:1,open:0,closed:1,estimatedOpen:0});
 expect(visiblePlacePins(fresh,60,false)).toHaveLength(0);
 expect(visiblePlacePins(fresh,60,true)[0].status).toBe('Listed closed around arrival');
 expect(a.places[0].hours.state).toBe('unknown');
});
