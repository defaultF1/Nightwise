import {afterEach,expect,test,vi} from 'vitest';
const bridge=vi.hoisted(()=>({open:vi.fn(),native:true}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>bridge.native},registerPlugin:(name:string)=>name==='MapsHandoff'?{open:bridge.open}:{}}));
import {openMaps} from '../../src/native';
import {mapsHandoff} from '../../src/domain/handoff';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
afterEach(()=>{vi.unstubAllGlobals();bridge.open.mockReset();bridge.native=true;});
test('Android receives the entire directions link for each selected app, never a destination pin',async()=>{
 for(const app of ['google','mappls'] as const){
  const url=mapsHandoff({...DEFAULT_JOURNEY,mode:'WALK'},undefined,undefined,app);
  await openMaps(url);
  expect(bridge.open).toHaveBeenLastCalledWith({url});
  expect(url).toContain(app==='google'?'travelmode=walking':'mode=walking');
 }
});
test('browser receives the same full route and the native failure is available to the UI',async()=>{
 const url=mapsHandoff(DEFAULT_JOURNEY);
 const open=vi.fn();vi.stubGlobal('window',{open});bridge.native=false;
 await openMaps(url);expect(open).toHaveBeenCalledWith(url,'_blank','noopener,noreferrer');expect(bridge.open).not.toHaveBeenCalled();
 bridge.native=true;bridge.open.mockRejectedValueOnce(new Error('No handler'));
 await expect(openMaps(url)).rejects.toThrow('No handler');
});
