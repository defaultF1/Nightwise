import {beforeEach,expect,test,vi} from 'vitest';
const state=vi.hoisted(()=>({value:null as string|null,stamp:'install:1'}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true},registerPlugin:()=>({installationStamp:async()=>({stamp:state.stamp})})}));
vi.mock('@capacitor/preferences',()=>({Preferences:{get:async()=>({value:state.value}),set:async({value}:{value:string})=>{state.value=value;},remove:async()=>{state.value=null;}}}));
beforeEach(()=>{state.value=null;state.stamp='install:1';vi.resetModules();});
test('restores after restart and clears after update',async()=>{
 let storage=await import('../../src/team-access');
 expect(await storage.loadTeamAccess()).toBe('');
 await storage.saveTeamAccess('test-code');
 vi.resetModules();storage=await import('../../src/team-access');
 expect(await storage.loadTeamAccess()).toBe('test-code');
 state.stamp='install:2';vi.resetModules();storage=await import('../../src/team-access');
 expect(await storage.loadTeamAccess()).toBe('');expect(state.value).toBeNull();
});
test('clearing the field removes saved code and fresh install starts empty',async()=>{
 const storage=await import('../../src/team-access');await storage.loadTeamAccess();
 await storage.saveTeamAccess('test-code');await storage.saveTeamAccess('');
 expect(state.value).toBeNull();expect(await storage.loadTeamAccess()).toBe('');
});
test('rapid edits persist in order',async()=>{
 const storage=await import('../../src/team-access');await storage.loadTeamAccess();
 await Promise.all([storage.saveTeamAccess('a'),storage.saveTeamAccess('ab'),storage.saveTeamAccess('abc')]);
 expect(await storage.loadTeamAccess()).toBe('abc');
});

