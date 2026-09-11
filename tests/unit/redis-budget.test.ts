import { describe, it, expect, vi } from 'vitest';
import { RedisBudget } from '../../server/redis-budget';
import { readConfig } from '../../server/config';
import { createServer } from '../../server/app';
import { DEFAULT_JOURNEY } from '../../src/domain/journey';

const counts = { routeCalls: 16, nearbyCalls: 641, autocompleteCalls: 2, detailsCalls: 2 };
const endpoint = 'https://example.upstash.io';
function budget(fetcher: typeof fetch) { return new RedisBudget(endpoint, 'test-redis-token', 'test-counter', 21, 720, 40, 20, fetcher); }
const result = (value: unknown) => new Response(JSON.stringify({ result: value }));

describe('persistent hosted allowance', () => {
  it('requires both REST credentials and rejects endpoints that could leak the token', () => {
    for (const env of [{ UPSTASH_REDIS_REST_URL: endpoint }, { UPSTASH_REDIS_REST_TOKEN: 'secret' },
      { UPSTASH_REDIS_REST_URL: 'http://example.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'secret' },
      { UPSTASH_REDIS_REST_URL: 'https://example.com', UPSTASH_REDIS_REST_TOKEN: 'secret' },
      { UPSTASH_REDIS_REST_URL: endpoint+'?token=secret', UPSTASH_REDIS_REST_TOKEN: 'secret' }]) expect(() => readConfig(env)).toThrow();
    expect(readConfig({ UPSTASH_REDIS_REST_URL: endpoint, UPSTASH_REDIS_REST_TOKEN: 'test' }).redisUrl).toBe(endpoint);
  });
  it('reads the same migrated counts after a new process instance and computes remaining allowance', async () => {
    const calls = vi.fn(async () => result(JSON.stringify(counts)));
    expect(await budget(calls).snapshot()).toMatchObject({ ...counts, remainingComparisons: 5 });
    expect(await budget(calls).canScan(79)).toBe(true);
    expect(await budget(calls).canScan(80)).toBe(false);
    expect(await budget(calls).snapshot()).toMatchObject(counts);
  });
  it('reports non-secret health reasons', async()=>{
    const replies=[result(JSON.stringify(counts)),result(-1)];
    expect(await budget(async()=>replies.shift()!).health()).toEqual({ready:true});
    expect(await budget(async()=>result(null)).health()).toEqual({ready:false,issue:'missing'});
    const expiring=[result(JSON.stringify(counts)),result(1000)];
    expect(await budget(async()=>expiring.shift()!).health()).toEqual({ready:false,issue:'expiring'});
    const invalid=[result('{bad'),result(-1)];
    expect(await budget(async()=>invalid.shift()!).health()).toEqual({ready:false,issue:'invalid'});
    expect(await budget(async()=>new Response('',{status:401})).health()).toEqual({ready:false,issue:'connection'});
  });
  it('fails closed on missing, malformed, fractional and negative counters', async () => {
    for (const raw of [null, '{bad', JSON.stringify({}), JSON.stringify({...counts,routeCalls:-1}), JSON.stringify({...counts,nearbyCalls:1.5})]) {
      await expect(budget(async () => result(raw)).snapshot()).rejects.toMatchObject({code:'budget-unavailable'});
    }
  });
  it('handles atomic reservations and preserves exhaustion as a 429', async () => {
    const calls=vi.fn<typeof fetch>(async () => result(['ok']));
    await budget(calls).reserve('nearby',3);
    const options=calls.mock.calls[0]?.[1] as RequestInit | undefined;
    // A request body carries the command; secrets never enter a query string.
    expect(calls.mock.calls[0][0]).toBe(endpoint);
    expect(JSON.parse(String(options?.body)).slice(2)).toEqual([1,'test-counter','nearbyCalls',3,720]);
    await expect(budget(async()=>result(['exhausted'])).reserve('route')).rejects.toMatchObject({code:'budget-exhausted',status:429});
    await expect(budget(async()=>result(['missing'])).reserve('route')).rejects.toMatchObject({code:'budget-unavailable'});
  });
  it('does not retry uncertain writes or expose transport/provider errors', async () => {
    const calls=vi.fn(async () => { throw Error('private endpoint and secret'); });
    await expect(budget(calls).reserve('route')).rejects.toThrow('No Google request was sent');
    expect(calls).toHaveBeenCalledTimes(1);
    await expect(budget(async()=>new Response(JSON.stringify({error:'secret'}),{status:401})).snapshot()).rejects.not.toThrow('secret');
  });
  it('never calls Google if Redis cannot reserve and keeps health checks available', async () => {
    const google=vi.fn();
    const redis=vi.fn(async(_input:RequestInfo|URL,init?:RequestInit)=>{
      const command=JSON.parse(String(init?.body));
      return result(command[0]==='GET'?null:['missing']);
    });
    const config=readConfig({HOST:'0.0.0.0',PILOT_ACCESS_CODE:'test-code-at-least-16',GOOGLE_MAPS_SERVER_KEY:'test-google-key',ENABLE_LIVE_REQUESTS:'true',
      UPSTASH_REDIS_REST_URL:endpoint,UPSTASH_REDIS_REST_TOKEN:'test-token',ROAD_DATA_PATH:'missing-fixture'});
    const app=await createServer(config,google,redis);
    try {
      expect((await app.inject('/api/status')).json()).toMatchObject({ready:false,budgetStorage:'redis',budgetReady:false,budgetIssue:'missing'});
      const r=await app.inject({method:'POST',url:'/api/compare',headers:{'x-nightwise-code':'test-code-at-least-16'},payload:DEFAULT_JOURNEY});
      expect(r.statusCode).toBe(503); expect(r.json().code).toBe('budget-unavailable'); expect(google).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
});
