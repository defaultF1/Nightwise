import {afterEach,expect,test,vi} from 'vitest';
const bridge=vi.hoisted(()=>({open:vi.fn(),available:vi.fn(),native:true}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>bridge.native},registerPlugin:(name:string)=>name==='MapsHandoff'?{open:bridge.open,available:bridge.available}:{}}));
import {openMaps,availableNavigationApps} from '../../src/native';
import {mapsHandoff} from '../../src/domain/handoff';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
afterEach(()=>{vi.unstubAllGlobals();bridge.open.mockReset();bridge.available.mockReset();bridge.native=true;});
test('Android receives the entire directions link for each selected app, never a destination pin',async()=>{
 for(const app of ['google','mappls'] as const){
  const url=mapsHandoff({...DEFAULT_JOURNEY,mode:'WALK'},undefined,undefined,app);
  await openMaps(url);
  expect(bridge.open).toHaveBeenLastCalledWith({url});
  expect(url).toContain(app==='google'?'travelmode=walking':'mode=walking');
 }
});

test('native choices only include installed supported apps and preserve an empty list',async()=>{
 for(const apps of [[],['mappls'],['google'],['mappls','google','unrelated']] ){
  bridge.available.mockResolvedValueOnce({apps});
  const result=await availableNavigationApps();
  expect(result.native).toBe(true);expect(result.apps.map(a=>a.value)).toEqual(['google','mappls'].filter(a=>apps.includes(a)));
 }
 bridge.available.mockRejectedValueOnce(new Error('Check failed'));
 await expect(availableNavigationApps()).rejects.toThrow('Check failed');
});
test('web choices are explicitly websites rather than an invented installed-app list',async()=>{
 bridge.native=false;expect((await availableNavigationApps()).native).toBe(false);expect(bridge.available).not.toHaveBeenCalled();
 bridge.native=true;await openMaps(mapsHandoff(DEFAULT_JOURNEY),true);expect(bridge.open).toHaveBeenLastCalledWith({url:mapsHandoff(DEFAULT_JOURNEY),browserOnly:true});
});
test('browser receives the same full route and the native failure is available to the UI',async()=>{
 const url=mapsHandoff(DEFAULT_JOURNEY);
 const open=vi.fn();vi.stubGlobal('window',{open});bridge.native=false;
 await openMaps(url);expect(open).toHaveBeenCalledWith(url,'_blank','noopener,noreferrer');expect(bridge.open).not.toHaveBeenCalled();
 bridge.native=true;bridge.open.mockRejectedValueOnce(new Error('No handler'));
 await expect(openMaps(url)).rejects.toThrow('No handler');
});
