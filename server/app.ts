import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { timingSafeEqual } from 'node:crypto';
import { Budget, type BudgetStore } from './budget';
import { RedisBudget } from './redis-budget';
import { GoogleProvider } from './google';
import { ServiceError } from './errors';
import type { ServerConfig } from './config';
import { inBengaluru, type LiveJourney } from '../src/domain/journey';
import { distanceMeters } from '../src/domain/geometry';
import { buildQueryPlan, analyzeRoute } from '../src/domain/activity';
import { compareActivity } from '../src/domain/comparison';
import type { NearbyScan } from '../src/domain/activity-types';
import type { LiveResult } from '../src/domain/live-contract';
import { registerSearch } from './search';
import { loadRoadAnalyzer } from './roads';

export async function createServer(config: ServerConfig, fetcher?: typeof fetch, budgetFetcher?: typeof fetch) {
  const app = Fastify({ logger: false, bodyLimit: 4096, requestTimeout: 120000, trustProxy: false });
  const budget: BudgetStore = config.redisUrl
    ? new RedisBudget(config.redisUrl, config.redisToken, config.redisKey, config.routeLimit, config.nearbyLimit, config.autocompleteLimit, config.detailsLimit, budgetFetcher)
    : new Budget(config.ledgerPath, config.routeLimit, config.nearbyLimit, config.autocompleteLimit, config.detailsLimit);
  const analyzeRoads = loadRoadAnalyzer(config.roadFile);
  const provider = new GoogleProvider(config.serverKey, budget, fetcher);
  let busy = false;
  await app.register(cors, { origin: config.allowedOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'X-Nightwise-Code'] });
  await app.register(rateLimit, { max: 30, timeWindow: '1 minute' });
  app.addHook('onClose', async () => budget.close());
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const origin = request.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) return reply.code(403).send({ code: 'origin-denied', message: 'This app origin is not enabled.' });
    if(config.accessCode&&request.url.startsWith('/api/places/')){
      const supplied=Buffer.from(String(request.headers['x-nightwise-code']||'')), expected=Buffer.from(config.accessCode);
      if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply.code(401).send({code:'access-required',message:'Enter the team access code in Settings to search Bengaluru.'});
    }
  });
  app.setErrorHandler((error, _request, reply) => {
    const e = error as { statusCode?: number };
    const known = error instanceof ServiceError;
    void reply.code(known ? error.status : e.statusCode === 429 ? 429 : e.statusCode === 400 ? 400 : 503).send({ code: known ? error.code : e.statusCode === 400 ? 'invalid-input' : 'unavailable', message: known ? error.message : 'The request could not be completed. Please check the journey and try again.' });
  });
  app.get('/api/status', async () => {
    let budgetReady = true, budgetIssue: 'connection'|'missing'|'expiring'|'invalid'|undefined;
    if (budget instanceof RedisBudget) ({ready:budgetReady,issue:budgetIssue}=await budget.health());
    else try { await budget.snapshot(); } catch { budgetReady = false; budgetIssue='invalid'; }
    return { ready: !!config.serverKey&&config.liveEnabled&&budgetReady, configured:!!config.serverKey, paused:!config.liveEnabled,
      searchEnabled:config.liveEnabled&&config.searchEnabled&&!!config.serverKey&&budgetReady, activityEnabled:config.enabled,
      scoringEnabled:config.scoring, accessCodeRequired:!!config.accessCode, maxQueries:config.maxQueries,
      budgetStorage:config.redisUrl?'redis':'file', budgetReady, ...(budgetIssue?{budgetIssue}:{}) };
  });
  registerSearch(app,config,budget,fetcher);
  const pointSchema = { type: 'object', additionalProperties: false, required: ['name', 'latitude', 'longitude'], properties: { name: { type: 'string', minLength: 1, maxLength: 100 }, latitude: { type: 'number', minimum: 12.75, maximum: 13.25 }, longitude: { type: 'number', minimum: 77.35, maximum: 77.85 } } };
  app.post<{ Body: LiveJourney }>('/api/compare', { schema: { body: { type: 'object', additionalProperties: false, required: ['origin', 'destination', 'mode'], properties: { origin: pointSchema, destination: pointSchema, mode: { type: 'string', enum: ['DRIVE'] } } } } }, async (request, reply) => {
    if (config.accessCode) {
      const supplied = Buffer.from(String(request.headers['x-nightwise-code'] || ''));
      const expected = Buffer.from(config.accessCode);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new ServiceError('access-required', 'Enter the team access code in Settings to use live comparisons.', 401);
    }
    if (!config.serverKey) throw new ServiceError('not-configured', 'Live routes need the server key and enabled Google services. Tutorial mode is ready.');
    if (!config.liveEnabled) throw new ServiceError('live-paused', 'Live Google requests are paused to control usage. Tutorial mode is ready.');
    const journey = request.body;
    if (!inBengaluru(journey.origin) || !inBengaluru(journey.destination) || distanceMeters(journey.origin, journey.destination) < 100) throw new ServiceError('outside-area', 'Choose different Bengaluru pins at least 100 m apart.', 422);
    if (busy) throw new ServiceError('busy', 'Another live comparison is running. Please wait before trying again.', 429);
    busy = true;
    const cancel = new AbortController();
    const signal = AbortSignal.any([cancel.signal, AbortSignal.timeout(90000)]);
    const closed = () => { if (!reply.raw.writableEnded) cancel.abort(); };
    request.raw.on('aborted', closed); reply.raw.on('close', closed);
    try {
      const routes = await provider.routes(journey, signal);
      let activityStatus: LiveResult['activityStatus'] = config.enabled ? 'complete' : 'disabled';
      const notices: string[] = [];
      const attributions: LiveResult['attributions'] = [];
      let plan: ReturnType<typeof buildQueryPlan> | null = null;
      const scans: NearbyScan[] = [];
      if (routes.length) {
        try { plan = buildQueryPlan(routes, 200, config.maxQueries); }
        catch { activityStatus = 'budget'; notices.push('These routes need more scans than the per-comparison limit. No partial route was ranked and no nearby requests were sent.'); }
      }
      if (plan && config.enabled && activityStatus !== 'budget') {
        if (!await budget.canScan(plan.queries.length)) { activityStatus = 'budget'; notices.push('The remaining pilot allowance cannot cover all routes. No nearby requests were sent.'); }
        else {
          let next = 0;
          await Promise.all(Array.from({ length: Math.min(3, plan.queries.length) }, async () => {
            while (!signal.aborted) {
              const query = plan!.queries[next++]; if (!query) return;
              try { const result = await provider.nearby(query, signal); scans.push(result.scan); attributions.push(...result.attributions); }
              catch { if (signal.aborted) return; scans.push({ queryId: query.id, observedAt: new Date().toISOString(), status: 'failed', places: [] }); }
            }
          }));
          if (cancel.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          if (scans.length !== plan.queries.length || scans.some(s => s.status !== 'ok')) activityStatus = 'partial';
        }
      }
      const checkedAt = new Date().toISOString();
      const analyses = plan ? routes.map(r => analyzeRoute(r, plan!, scans, checkedAt)) : [];
      if (activityStatus === 'complete' && analyses.some(a => !a.coreComparable)) activityStatus = 'partial';
      if (!config.enabled) notices.push('Live activity scans are switched off. Travel times are live; activity is not assessed.');
      if (!config.scoring) notices.push('Experimental live scoring awaits provider-use review and local calibration. No live Night Activity Score is published.');
      const roadAnalyses=Object.fromEntries(routes.map(r=>[r.id,analyzeRoads(r.path,r.steps)]));
      if(routes.length)attributions.push({name:'© OpenStreetMap contributors · ODbL',uri:'https://www.openstreetmap.org/copyright'});
      notices.push('Road type is estimated from a local OpenStreetMap extract around North Bengaluru. Unmatched, ambiguous and grade-separated sections remain unknown. Actual staffing, lighting and crime are not measured.');
      const roads = Object.fromEntries(routes.map(r => [r.id, { ...roadAnalyses[r.id], ...(r.turns!==undefined?{maneuversPerKm:r.turns/(r.distanceMeters/1000)}:{}) }]));
      const comparison = compareActivity(routes, analyses, roads, { allowLive: config.scoring });
      return { routes, analyses, roadAnalyses, comparison, checkedAt, activityStatus, notices, attributions: [...new Map(attributions.map(a => [a.name + (a.uri || ''), a])).values()], usage: await budget.snapshot() } satisfies LiveResult;
    } finally { busy = false; request.raw.off('aborted', closed); reply.raw.off('close', closed); }
  });
  return app;
}
