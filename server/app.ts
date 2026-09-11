import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { Budget, type BudgetStore } from './budget';
import { RedisBudget } from './redis-budget';
import { GoogleProvider } from './google';
import { ServiceError } from './errors';
import type { ServerConfig } from './config';
import { inPilotArea, sameServiceRegion, regionForPoint, SERVICE_REGIONS, type LiveJourney } from '../src/domain/journey';
import { distanceMeters } from '../src/domain/geometry';
import { buildQueryPlan, analyzeRoute } from '../src/domain/activity';
import { compareActivity } from '../src/domain/comparison';
import type { NearbyScan } from '../src/domain/activity-types';
import type { LiveResult } from '../src/domain/live-contract';
import { registerSearch } from './search';
import { loadRoadAnalyzer } from './roads';
import { balancedPlan, collectScans } from './scan';

export async function createServer(config: ServerConfig, fetcher?: typeof fetch, budgetFetcher?: typeof fetch) {
  const app = Fastify({ logger: false, bodyLimit: 4096, requestTimeout: 120000, trustProxy: false });
  const budget: BudgetStore = config.redisUrl
    ? new RedisBudget(config.redisUrl, config.redisToken, config.redisKey, config.routeLimit, config.nearbyLimit, config.autocompleteLimit, config.detailsLimit, budgetFetcher)
    : new Budget(config.ledgerPath, config.routeLimit, config.nearbyLimit, config.autocompleteLimit, config.detailsLimit);
  const roadFiles = {'north-bengaluru':config.roadFile,kanpur:config.kanpurRoadFile};
  const provider = new GoogleProvider(config.serverKey, budget, fetcher);
  let busy = false;
  await app.register(cors, { origin: config.allowedOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] });
  await app.register(rateLimit, { max: 30, timeWindow: '1 minute' });
  app.addHook('onClose', async () => budget.close());
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const origin = request.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) return reply.code(403).send({ code: 'origin-denied', message: 'This app origin is not enabled.' });
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
    return { buildVersion:'0.11.0-live-preview',searchPreviewEnabled:config.liveEnabled&&config.searchEnabled&&!!config.serverKey&&budgetReady,scanStrategy:'partition-and-spatial-v1',scoringVersion:'experimental-live-activity-v4-bounds',serviceRadiusMeters:10000,serviceRegions:SERVICE_REGIONS.map(r=>({id:r.id,city:r.city,radiusMeters:r.radiusMeters})),ready: !!config.serverKey&&config.liveEnabled&&budgetReady, configured:!!config.serverKey, paused:!config.liveEnabled,
      searchEnabled:config.liveEnabled&&config.searchEnabled&&!!config.serverKey&&budgetReady, activityEnabled:config.enabled,
      scoringEnabled:config.scoring, accessCodeRequired:false, maxQueries:config.maxQueries,
      budgetStorage:config.redisUrl?'redis':'file', budgetReady, ...(budgetIssue?{budgetIssue}:{}) };
  });
  registerSearch(app,config,budget,fetcher);
  const pointSchema = { type: 'object', additionalProperties: false, required: ['name', 'latitude', 'longitude'], properties: { name: { type: 'string', minLength: 1, maxLength: 100 }, latitude: { type: 'number', minimum: -90, maximum: 90 }, longitude: { type: 'number', minimum: -180, maximum: 180 } } };
  app.post<{ Body: LiveJourney }>('/api/compare', { schema: { body: { type: 'object', additionalProperties: false, required: ['origin', 'destination', 'mode'], properties: { origin: pointSchema, destination: pointSchema, mode: { type: 'string', enum: ['DRIVE'] } } } } }, async (request, reply) => {
    if (!config.serverKey) throw new ServiceError('not-configured', 'Live routes need the server key and enabled Google services. Tutorial mode is ready.');
    if (!config.liveEnabled) throw new ServiceError('live-paused', 'Live Google requests are paused to control usage. Tutorial mode is ready.');
    const journey = request.body;
    if (!inPilotArea(journey.origin) || !inPilotArea(journey.destination) || !sameServiceRegion(journey.origin,journey.destination) || distanceMeters(journey.origin, journey.destination) < 100) throw new ServiceError('outside-area', 'Choose pins in the same supported city (North Bengaluru or Kanpur), at least 100 m apart.', 422);
    if (busy) throw new ServiceError('busy', 'Another live comparison is running. Please wait before trying again.', 429);
    busy = true;
    const cancel = new AbortController();
    const signal = AbortSignal.any([cancel.signal, AbortSignal.timeout(90000)]);
    const closed = () => { if (!reply.raw.writableEnded) cancel.abort(); };
    request.raw.on('aborted', closed); reply.raw.on('close', closed);
    try {
      const usageBefore=await budget.snapshot();
      const routes = await provider.routes(journey, signal);
      let activityStatus: LiveResult['activityStatus'] = config.enabled ? 'complete' : 'disabled';
      const notices: string[] = [];
      const attributions: LiveResult['attributions'] = [];
      let plan: ReturnType<typeof buildQueryPlan> | null = null;
      const scans: NearbyScan[] = [];
      if (routes.length) {
        try { const remaining=Math.max(0,usageBefore.nearbyLimit-usageBefore.nearbyCalls);plan = balancedPlan(routes,Math.min(config.maxQueries,remaining)); }
        catch { activityStatus = 'budget'; notices.push('These routes need more scans than the per-comparison limit. No partial route was ranked and no nearby requests were sent.'); }
      }
      if (plan && config.enabled && activityStatus !== 'budget') {
        if (!await budget.canScan(plan.queries.length)) { activityStatus = 'budget'; notices.push('The remaining pilot allowance cannot cover all routes. No nearby requests were sent.'); }
        else {
          const collected=await collectScans(plan,provider,signal,Math.min(config.maxQueries,Math.max(0,usageBefore.nearbyLimit-usageBefore.nearbyCalls)));
          scans.push(...collected.scans);attributions.push(...collected.attributions);
          if(collected.refined)notices.push(`${collected.refined} result-limited search areas were checked with smaller overlapping searches. Remaining caps stay partial.`);
          const previewTime=new Date().toISOString();
          const unknownByRoute=routes.map(r=>analyzeRoute(r,plan!,scans,previewTime).places.filter(p=>p.hours.state==='unknown'&&!p.conflict));
          const detailIds=new Set<string>();
          for(let i=0;unknownByRoute.some(p=>p[i])&&detailIds.size<4;i++)for(const places of unknownByRoute){if(places[i]&&detailIds.size<4)detailIds.add(places[i].id);}
          let detailsAdded=0;
          for(const id of detailIds){
            if(signal.aborted)break;
            const allowance=await budget.snapshot();if(allowance.detailsCalls>=allowance.detailsLimit)break;
            try{const detail=await provider.details(id,signal);attributions.push(...detail.attributions);const place=detail.scan.status==='ok'?detail.scan.places[0]:undefined;
              if(place){for(const scan of scans)scan.places=scan.places.map(p=>p.id===id?place:p);detailsAdded++;}
            }catch{/* Preserve the original missing-hours evidence on failure. */}
          }
          if(detailsAdded)notices.push(`${detailsAdded} listings with missing hours received a targeted details check. Missing schedules still remain unknown.`);
          if (cancel.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          if (scans.length !== plan.queries.length || scans.some(s => s.status !== 'ok')) activityStatus = 'partial';
        }
      }
      const checkedAt = new Date().toISOString();
      const analyses = plan ? routes.map(r => analyzeRoute(r, plan!, scans, checkedAt)) : [];
      if (activityStatus === 'complete' && analyses.some(a => !a.coreComparable)) activityStatus = 'partial';
      if (!config.enabled) notices.push('Live activity scans are switched off. Travel times are live; activity is not assessed.');
      if (!config.scoring) notices.push('Experimental live scoring is disabled by the service setting.');
      else notices.push('Live scores are experimental evidence ranges, not safety ratings or calibrated predictions. Missing data widens the range.');
      const analyzeRoads=loadRoadAnalyzer(roadFiles[regionForPoint(journey.origin)!.id]);
      const roadAnalyses=Object.fromEntries(routes.map(r=>[r.id,analyzeRoads(r.path,r.steps)]));
      if(routes.length)attributions.push({name:'© OpenStreetMap contributors · ODbL',uri:'https://www.openstreetmap.org/copyright'});
      notices.push('Road type is estimated from a local OpenStreetMap extract for the selected city. Unmatched, ambiguous and grade-separated sections remain unknown. Actual staffing, lighting and crime are not measured.');
      const roads = Object.fromEntries(routes.map(r => [r.id, { ...roadAnalyses[r.id], ...(r.turns!==undefined?{maneuversPerKm:r.turns/(r.distanceMeters/1000)}:{}) }]));
      const comparison = compareActivity(routes, analyses, roads, { allowLive: config.scoring });
      const usage=await budget.snapshot();
      return { routes, analyses, roadAnalyses, comparison, checkedAt, activityStatus, notices, attributions: [...new Map(attributions.map(a => [a.name + (a.uri || ''), a])).values()], usage,
        requestUsage:{routeCalls:usage.routeCalls-usageBefore.routeCalls,nearbyCalls:usage.nearbyCalls-usageBefore.nearbyCalls,detailsCalls:usage.detailsCalls-usageBefore.detailsCalls,scope:'Shared counter delta during this comparison; concurrent search requests may contribute.'} } satisfies LiveResult;
    } finally { busy = false; request.raw.off('aborted', closed); reply.raw.off('close', closed); }
  });
  return app;
}
