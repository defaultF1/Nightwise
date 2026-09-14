import {it,expect,vi} from 'vitest';
import {ComparisonCache,COMPARISON_CACHE_MS} from '../../src/providers/comparison-cache';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
import type {LiveResult} from '../../src/domain/live-contract';
import {PlacesCache} from '../../server/google';
const start=Date.parse('2026-09-14T10:00:00Z');
const result=()=>({routes:[{id:'r'}],analyses:[],checkedAt:new Date(start).toISOString(),activityStatus:'partial',requestUsage:{routeCalls:1,nearbyCalls:50,detailsCalls:2}} as unknown as LiveResult);
it('reuses a result locally for less than five minutes without renewing its timestamp',()=>{
 let now=start;const cache=new ComparisonCache(()=>now),key=cache.key(DEFAULT_JOURNEY,'test-code');
 cache.set(key,result());now+=COMPARISON_CACHE_MS-1;
 const saved=cache.get(key)!;expect(saved.checkedAt).toBe(new Date(start).toISOString());expect(saved.cacheSource).toBe('device');expect(saved.requestUsage).toMatchObject({routeCalls:0,nearbyCalls:0,detailsCalls:0});
 saved.routes[0].id='changed';expect(cache.get(key)?.routes[0].id).toBe('r');
 now++;expect(cache.get(key)).toBeUndefined();expect(cache.requiresFresh(key)).toBe(true);
});
it('separates origin, destination, direction and access-code context',()=>{
 const cache=new ComparisonCache(()=>start),key=cache.key(DEFAULT_JOURNEY,'a');cache.set(key,result());
 for(const k of [cache.key({...DEFAULT_JOURNEY,origin:DEFAULT_JOURNEY.destination,destination:DEFAULT_JOURNEY.origin},'a'),cache.key({...DEFAULT_JOURNEY,destination:{...DEFAULT_JOURNEY.destination,latitude:13.05}},'a'),cache.key(DEFAULT_JOURNEY,'b')])expect(cache.get(k)).toBeUndefined();
 cache.delete(key);expect(cache.get(key)).toBeUndefined();
});
it('keeps fresh-fetch intent after an unsuccessful refresh instead of serving the old result',()=>{
 const cache=new ComparisonCache(()=>start);cache.set('r',result());cache.invalidate('r');
 expect(cache.get('r')).toBeUndefined();expect(cache.requiresFresh('r')).toBe(true);
 cache.set('r',result());expect(cache.requiresFresh('r')).toBe(false);expect(cache.get('r')).toBeDefined();
});
it('expires earlier when a listed place closes during the five-minute window',()=>{
 let now=start;const cache=new ComparisonCache(()=>now);
 cache.set('closing',{...result(),analyses:[{places:[{hours:{state:'open',minutesUntilClose:2},categories:[],conflict:false}]}]} as unknown as LiveResult);
 now+=119999;expect(cache.get('closing')).toBeDefined();now++;expect(cache.get('closing')).toBeUndefined();
});
it('does not retain budget failures, expired checks or unlimited journey history',()=>{
 const cache=new ComparisonCache(()=>start);cache.set('budget',{...result(),activityStatus:'budget'});expect(cache.get('budget')).toBeUndefined();
 cache.set('old',{...result(),checkedAt:new Date(start-COMPARISON_CACHE_MS).toISOString()});expect(cache.get('old')).toBeUndefined();
 for(const key of ['a','b','c','d'])cache.set(key,result());expect(cache.get('a')).toBeUndefined();expect(cache.get('d')).toBeDefined();
});
it('server places reuse expires at five minutes and keeps category footprints separate',()=>{
 let now=start;const clock=vi.spyOn(Date,'now').mockImplementation(()=>now);
 try{
 const cache=new PlacesCache(),q={id:'q',coordinate:DEFAULT_JOURNEY.origin,radiusMeters:150};
 cache.set(q,{scan:{queryId:'q',observedAt:new Date(start).toISOString(),status:'ok',places:[]},attributions:[]});
 now+=COMPARISON_CACHE_MS-1;expect(cache.get({...q,id:'shared-route'})?.scan.queryId).toBe('shared-route');
 expect(cache.get({...q,partition:'help'})).toBeUndefined();now++;expect(cache.get(q)).toBeUndefined();
 }finally{clock.mockRestore();}
});
