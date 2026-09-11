import {expect,test} from 'vitest';
import {collectScans} from '../../server/scan';
import {SEARCH_PARTITIONS} from '../../server/google';
import type {NearbyQuery,NearbyScan} from '../../src/domain/activity-types';
const q={id:'q',coordinate:{latitude:13.06,longitude:77.6},radiusMeters:150};
const plan={queries:[q],samplesByRoute:{},totalSamples:1};
test('category partitions cover the original ten categories',()=>{
  expect(new Set(Object.values(SEARCH_PARTITIONS).flat()).size).toBe(10);
});
test('a failed partition cannot turn a capped search into a complete scan',async()=>{
  const queries:NearbyQuery[]=[];
  const nearby=async(query:NearbyQuery)=>{queries.push(query);return {scan:{queryId:query.id,observedAt:new Date().toISOString(),status:query.partition==='places'?'failed':query.partition?'ok':'capped',places:[]} as NearbyScan,attributions:[]};};
  const r=await collectScans(plan,{nearby},new AbortController().signal,3);
  expect(r.calls).toBe(3);expect(r.scans[0].status).toBe('capped');
  for(const query of queries){expect(query.coordinate).toEqual(q.coordinate);expect(query.radiusMeters).toBe(q.radiusMeters);}
  queries.length=0;expect((await collectScans(plan,{nearby},new AbortController().signal,2)).calls).toBe(1);
});
test('initial requests also respect the hard limit',async()=>{
  let calls=0;const r=await collectScans({...plan,queries:[q,{...q,id:'q2'}]},{nearby:async query=>{calls++;return {scan:{queryId:query.id,status:'ok',observedAt:new Date().toISOString(),places:[]},attributions:[]};}},new AbortController().signal,1);
  expect(calls).toBe(1);expect(r.calls).toBe(1);expect(r.scans.length).toBe(1);
});
