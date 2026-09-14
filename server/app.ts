import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { timingSafeEqual } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Budget, type BudgetStore } from './budget';
import { RedisBudget, redisCommand } from './redis-budget';
import { GoogleProvider } from './google';
import { ServiceError } from './errors';
import type { ServerConfig } from './config';
import { inPilotArea, sameServiceRegion, regionForPoint, PILOT_RADIUS_METERS, SERVICE_REGIONS, type LiveJourney } from '../src/domain/journey';
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
  await app.register(cors, { origin: config.allowedOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'X-Nightwise-Code'] });
  await app.register(rateLimit, { max: 30, timeWindow: '1 minute' });
  app.addHook('onClose', async () => budget.close());
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const origin = request.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) return reply.code(403).send({ code: 'origin-denied', message: 'This app origin is not enabled.' });
    if(config.accessCode&&request.url.startsWith('/api/places/')){
      const supplied=Buffer.from(String(request.headers['x-nightwise-code']||'')), expected=Buffer.from(config.accessCode);
      if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return reply.code(401).send({code:'access-required',message:'Enter the team access code in Settings to search places.'});
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
    return { buildVersion:'0.11.0-live-preview',searchPreviewEnabled:config.liveEnabled&&config.searchEnabled&&!!config.serverKey&&budgetReady,scanStrategy:'partition-and-spatial-v1',scoringVersion:'night-activity-v5-observed',serviceRadiusMeters:PILOT_RADIUS_METERS,serviceRegions:SERVICE_REGIONS.map(r=>({id:r.id,city:r.city,radiusMeters:r.radiusMeters})),ready: !!config.serverKey&&config.liveEnabled&&budgetReady, configured:!!config.serverKey, paused:!config.liveEnabled,
      searchEnabled:config.liveEnabled&&config.searchEnabled&&!!config.serverKey&&budgetReady, activityEnabled:config.enabled,
      scoringEnabled:config.scoring, accessCodeRequired:!!config.accessCode, maxQueries:config.maxQueries,
      budgetStorage:config.redisUrl?'redis':'file', budgetReady, ...(budgetIssue?{budgetIssue}:{}) };
  });
  registerSearch(app,config,budget,fetcher);
  // Anonymous pilot feedback: a rating plus coarse context, never coordinates.
  app.post<{ Body: { rating: 'up' | 'down'; routeLabel?: string; city?: string } }>('/api/feedback', { schema: { body: { type: 'object', additionalProperties: false, required: ['rating'], properties: { rating: { type: 'string', enum: ['up', 'down'] }, routeLabel: { type: 'string', maxLength: 40 }, city: { type: 'string', maxLength: 40 } } } } }, async request => {
    const entry = JSON.stringify({ ...request.body, at: new Date().toISOString() });
    try {
      if (config.redisUrl) {
        await redisCommand(config.redisUrl, config.redisToken, ['LPUSH', 'nightwise:feedback:v1', entry], budgetFetcher);
        await redisCommand(config.redisUrl, config.redisToken, ['LTRIM', 'nightwise:feedback:v1', 0, 999], budgetFetcher);
      } else {
        mkdirSync(dirname(config.ledgerPath), { recursive: true });
        appendFileSync(join(dirname(config.ledgerPath), 'feedback.jsonl'), entry + '\n');
      }
    } catch { throw new ServiceError('feedback-unavailable', 'Feedback could not be saved right now.'); }
    return { ok: true };
  });
  const pointSchema = { type: 'object', additionalProperties: false, required: ['name', 'latitude', 'longitude'], properties: { name: { type: 'string', minLength: 1, maxLength: 100 }, latitude: { type: 'number', minimum: -90, maximum: 90 }, longitude: { type: 'number', minimum: -180, maximum: 180 } } };
  app.post<{ Body: LiveJourney & {refresh?:boolean} }>('/api/compare', { schema: { body: { type: 'object', additionalProperties: false, required: ['origin', 'destination', 'mode'], properties: { refresh:{type:'boolean'}, departureTime:{type:'string',format:'date-time'}, origin: pointSchema, destination: pointSchema, mode: { type: 'string', enum: ['DRIVE','WALK','TWO_WHEELER'] } } } } }, async (request, reply) => {
    if (config.accessCode) {
      const supplied = Buffer.from(String(request.headers['x-nightwise-code'] || ''));
      const expected = Buffer.from(config.accessCode);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new ServiceError('access-required', 'Enter the team access code in Settings to use live comparisons.', 401);
    }
    if (!config.serverKey) throw new ServiceError('not-configured', 'Live routes need the server key and enabled Google services. Tutorial mode is ready.');
    if (!config.liveEnabled) throw new ServiceError('live-paused', 'Live Google requests are paused to control usage. Tutorial mode is ready.');
    const journey = request.body;
    if(journey.departureTime){const delay=Date.parse(journey.departureTime)-Date.now();if(!Number.isFinite(delay)||delay<0||delay>5*60*60_000)throw new ServiceError('invalid-departure','Choose a departure time from now to five hours ahead.',422);}
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
        try {
          const remaining=Math.max(0,usageBefore.nearbyLimit-usageBefore.nearbyCalls);
          if(config.enabled&&!remaining){activityStatus='budget';notices.push('The nearby-search allowance is used up. Routes are available, but shop, hospital and fuel scans could not run. Increase the allowance, then refresh.');}
          else plan = balancedPlan(routes,Math.min(config.maxQueries,remaining));
        }
        catch { activityStatus = 'budget'; notices.push('These routes need more scans than the per-comparison limit. No partial route was ranked and no nearby requests were sent.'); }
      }
      if (plan && config.enabled && activityStatus !== 'budget') {
        if (!await budget.canScan(plan.queries.length)) { activityStatus = 'budget'; notices.push('The remaining pilot allowance cannot cover all routes. No nearby requests were sent.'); }
        else {
          const collected=await collectScans(plan,{nearby:(q,s)=>provider.nearby(q,s,request.body.refresh===true)},signal,Math.min(config.maxQueries,Math.max(0,usageBefore.nearbyLimit-usageBefore.nearbyCalls)));
          scans.push(...collected.scans);attributions.push(...collected.attributions);
          if(collected.refined)notices.push(`${collected.refined} result-limited search areas were checked with smaller overlapping searches. Remaining caps stay partial.`);
          const previewTime=journey.departureTime??new Date().toISOString();
          const unknownByRoute=routes.map(r=>analyzeRoute(r,plan!,scans,previewTime,new Date().toISOString()).places.filter(p=>p.hours.state==='unknown'&&!p.conflict));
          const detailIds=new Set<string>();
          for(let i=0;unknownByRoute.some(p=>p[i])&&detailIds.size<4;i++)for(const places of unknownByRoute){if(places[i]&&detailIds.size<4)detailIds.add(places[i].id);}
          let detailsAdded=0;
          for(const id of detailIds){
            if(signal.aborted)break;
            const allowance=await budget.snapshot();if(allowance.detailsCalls>=allowance.detailsLimit)break;
            try{const detail=await provider.details(id,signal,request.body.refresh===true);attributions.push(...detail.attributions);const place=detail.scan.status==='ok'?detail.scan.places[0]:undefined;
              if(place){for(const scan of scans)scan.places=scan.places.map(p=>p.id===id?place:p);detailsAdded++;}
            }catch{/* Preserve the original missing-hours evidence on failure. */}
          }
          if(detailsAdded)notices.push(`${detailsAdded} listings with missing hours received a targeted details check. Missing schedules still remain unknown.`);
          if (cancel.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          if (scans.length !== plan.queries.length || scans.some(s => s.status !== 'ok')) activityStatus = 'partial';
        }
      }
      const checkedAt = new Date().toISOString();
      const analyses = plan ? routes.map(r => analyzeRoute(r, plan!, scans, journey.departureTime??checkedAt,checkedAt)) : [];
      if (activityStatus === 'complete' && analyses.some(a => !a.coreComparable)) activityStatus = 'partial';
      if (!config.enabled) notices.push('Live activity scans are switched off. Travel times are live; activity is not assessed.');
      if (!config.scoring) notices.push('Experimental live scoring is disabled by the service setting.');
      else notices.push('Live scores are experimental estimates from listed data, not safety ratings.');
      const analyzeRoads=loadRoadAnalyzer(roadFiles[regionForPoint(journey.origin)!.id],routes.map(r=>r.path));
      const roadAnalyses=Object.fromEntries(routes.map(r=>[r.id,analyzeRoads(r.path,r.steps)]));
      if(routes.length)attributions.push({name:'© OpenStreetMap contributors · ODbL',uri:'https://www.openstreetmap.org/copyright'});
      notices.push('Road type is estimated from a local OpenStreetMap extract for the selected city. Unmatched, ambiguous and grade-separated sections remain unknown. Actual staffing, lighting and crime are not measured.');
      const roads = Object.fromEntries(routes.map(r => [r.id, { ...roadAnalyses[r.id], ...(r.turns!==undefined?{maneuversPerKm:r.turns/(r.distanceMeters/1000)}:{}) }]));
      const comparison = compareActivity(routes, analyses, journey.mode==='WALK'?{}:roads, { allowLive: config.scoring });
      const usage=await budget.snapshot();
      return { routes, analyses, roadAnalyses, comparison, checkedAt, activityStatus, notices, attributions: [...new Map(attributions.map(a => [a.name + (a.uri || ''), a])).values()], usage,
        requestUsage:{routeCalls:usage.routeCalls-usageBefore.routeCalls,nearbyCalls:usage.nearbyCalls-usageBefore.nearbyCalls,detailsCalls:usage.detailsCalls-usageBefore.detailsCalls,scope:'Shared counter delta during this comparison; concurrent search requests may contribute.'} } satisfies LiveResult;
    } finally { busy = false; request.raw.off('aborted', closed); reply.raw.off('close', closed); }
  });
  return app;
}
