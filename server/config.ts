export type ServerConfig = ReturnType<typeof readConfig>;
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const integer = (name: string, fallback: number, max: number) => {
    const n = Number(env[name] ?? fallback);
    if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`Invalid ${name}`);
    return n;
  };
  const host = env.HOST || '127.0.0.1';
  const accessCode = env.PILOT_ACCESS_CODE || '';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && accessCode.length < 16) throw new Error('A hosted pilot requires a PILOT_ACCESS_CODE of at least 16 characters');
  const redisUrl = env.UPSTASH_REDIS_REST_URL || '';
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!!redisUrl !== !!redisToken) throw new Error('Both Upstash REST settings are required');
  if (redisUrl) {
    let valid = false;
    try { const url = new URL(redisUrl); valid = url.protocol === 'https:' && url.hostname.endsWith('.upstash.io') && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'; } catch { /* Report no secret values. */ }
    if (!valid) throw new Error('Use the HTTPS Upstash REST endpoint without a command or query');
  }
  return {
    host, port: integer('PORT', 8787, 65535), serverKey: env.GOOGLE_MAPS_SERVER_KEY || '', accessCode,
    liveEnabled: env.ENABLE_LIVE_REQUESTS === 'true', searchEnabled: env.ENABLE_PLACE_SEARCH === 'true',
    autocompleteLimit: integer('PILOT_AUTOCOMPLETE_LIMIT', 40, 200), detailsLimit: integer('PILOT_DETAILS_LIMIT', 20, 100),
    kanpurRoadFile: env.KANPUR_ROAD_DATA_PATH || 'data/roads/kanpur-22km.json',
    roadFile: env.ROAD_DATA_PATH || 'data/roads/north-bengaluru-10km.json',
    enabled: env.ENABLE_ACTIVITY_ANALYSIS === 'true', scoring: env.ENABLE_EXPERIMENTAL_SCORING === 'true',
    maxQueries: integer('MAX_NEARBY_QUERIES', 120, 120), routeLimit: integer('PILOT_ROUTE_LIMIT', 10, 100),
    nearbyLimit: integer('PILOT_NEARBY_LIMIT', 600, 3000),
    ledgerPath: env.BUDGET_LEDGER_PATH || '.local/pilot-budget.json',
    redisUrl, redisToken, redisKey: 'nightwise:pilot-budget:v1',
    allowedOrigins: (env.ALLOWED_ORIGINS || 'http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173,https://localhost,http://localhost').split(',').map(s => s.trim()),
  };
}
