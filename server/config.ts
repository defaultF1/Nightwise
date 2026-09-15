export type ServerConfig = ReturnType<typeof readConfig>;
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const integer = (name: string, fallback: number, max: number) => {
    const n = Number(env[name] ?? fallback);
    if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`Invalid ${name}: use a whole number between 1 and ${max}`);
    return n;
  };
  const host = env.HOST || '127.0.0.1';
  // Public app: legacy PILOT_ACCESS_CODE must not re-enable a hidden code gate.
  const accessCode = '';
  const redisUrl = env.UPSTASH_REDIS_REST_URL || '';
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!!redisUrl !== !!redisToken) throw new Error('Both Upstash REST settings are required');
  if (redisUrl) {
    let valid = false;
    try { const url = new URL(redisUrl); valid = url.protocol === 'https:' && url.hostname.endsWith('.upstash.io') && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'; } catch { /* Report no secret values. */ }
    if (!valid) throw new Error('Use the HTTPS Upstash REST endpoint without a command or query');
  }
  return {
    // Mappls is the default provider; Google code stays available only behind an explicit opt-in.
    provider: env.API_PROVIDER === 'google' ? 'google' as const : 'mappls' as const,
    host, port: integer('PORT', 8787, 65535), serverKey: (env.API_PROVIDER === 'google' ? env.GOOGLE_MAPS_SERVER_KEY : env.MAPPLS_SERVER_KEY) || '', accessCode,
    liveEnabled: env.ENABLE_LIVE_REQUESTS === 'true', searchEnabled: env.ENABLE_PLACE_SEARCH === 'true',
    // The maxima are typo guards against a runaway paid-request allowance, not usage targets.
    autocompleteLimit: integer('PILOT_AUTOCOMPLETE_LIMIT', 40, 500), detailsLimit: integer('PILOT_DETAILS_LIMIT', 20, 500),
    kanpurRoadFile: env.KANPUR_ROAD_DATA_PATH || 'data/roads/kanpur-22km.json',
    roadFile: env.ROAD_DATA_PATH || 'data/roads/north-bengaluru-22km.json',
    enabled: env.ENABLE_ACTIVITY_ANALYSIS === 'true', scoring: env.ENABLE_EXPERIMENTAL_SCORING === 'true',
    maxQueries: integer('MAX_NEARBY_QUERIES', 120, 120), routeLimit: integer('PILOT_ROUTE_LIMIT', 10, 500),
    nearbyLimit: integer('PILOT_NEARBY_LIMIT', 600, 20000),
    ledgerPath: env.BUDGET_LEDGER_PATH || '.local/pilot-budget.json',
    redisUrl, redisToken, redisKey: 'nightwise:pilot-budget:v1',
    allowedOrigins: (env.ALLOWED_ORIGINS || 'http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173,https://localhost,http://localhost').split(',').map(s => s.trim()),
  };
}
