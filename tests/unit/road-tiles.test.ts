import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {loadRoadAnalyzer} from '../../server/roads';
it('loads nearby road tiles, skips unrelated tiles and matches a boundary-crossing road',()=>{
 const root=mkdtempSync(join(tmpdir(),'nightwise-tiles-'));
 const path=[{latitude:13.06,longitude:77.599},{latitude:13.06,longitude:77.603}];
 const key=`${Math.floor(path[0].longitude/.025)}_${Math.floor(path[0].latitude/.025)}`;
 const manifest=join(root,'index.json');
 try{
  mkdirSync(join(root,'roads'));
  writeFileSync(manifest,JSON.stringify({format:'nightwise-road-tiles-v1',tileSize:.025,directory:'roads',tiles:[key,'9999_9999'],osm3s:{timestamp_osm_base:'2026-09-14T00:00:00Z'}}));
  writeFileSync(join(root,'roads',key+'.json'),JSON.stringify({elements:[{type:'way',id:1,tags:{highway:'residential'},geometry:path.map(p=>({lat:p.latitude,lon:p.longitude}))}]}));
  const a=loadRoadAnalyzer(manifest,[path])(path);
  expect(a.coverage).toBeCloseTo(1);expect(a.internalMeters).toBeGreaterThan(400);
  expect(a.snapshotDate).toBe('2026-09-14T00:00:00Z');
  const far=path.map(p=>({...p,longitude:p.longitude+.1}));
  expect(loadRoadAnalyzer(manifest,[far])(far).status).toBe('unavailable');
 }finally{if(resolve(root).startsWith(resolve(tmpdir())))rmSync(root,{recursive:true,force:true});}
});
