import type { BudgetKind, BudgetSnapshot, BudgetStore } from './budget';
import { ServiceError } from './errors';

const fields = ['routeCalls', 'nearbyCalls', 'autocompleteCalls', 'detailsCalls'] as const;
// Read, validate and reserve in one atomic operation, including across server instances.
// A missing counter is NEVER initialized by the running app. Migration is explicit.
export const RESERVE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return {'missing'} end
if redis.call('PTTL', KEYS[1]) ~= -1 then return {'invalid'} end
local ok, data = pcall(cjson.decode, raw)
if not ok or type(data) ~= 'table' then return {'invalid'} end
local fields = {'routeCalls','nearbyCalls','autocompleteCalls','detailsCalls'}
for _, field in ipairs(fields) do
  local n = data[field]
  if type(n) ~= 'number' or n < 0 or n > 9007199254740991 or n ~= math.floor(n) then return {'invalid'} end
end
local field, amount, limit = ARGV[1], tonumber(ARGV[2]), tonumber(ARGV[3])
if data[field] == nil or not amount or amount < 1 or amount ~= math.floor(amount) or not limit then return {'invalid'} end
if data[field] + amount > limit then return {'exhausted'} end
data[field] = data[field] + amount
redis.call('SET', KEYS[1], cjson.encode(data))
return {'ok'}
`;

// Shared Upstash REST call. Never exposes a token, endpoint or transport error,
// and never retries: a lost response might still represent a completed write.
export async function redisCommand(url: string, token: string, command: (string | number)[], fetcher: typeof fetch = fetch): Promise<unknown> {
  try {
    const response = await fetcher(url, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command), signal: AbortSignal.timeout(8000), redirect: 'error',
    });
    if (!response.ok) throw new Error();
    const text = await response.text();
    if (text.length > 8192) throw new Error();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || data.error || !Object.hasOwn(data, 'result')) throw new Error();
    return data.result;
  } catch {
    throw new ServiceError('budget-unavailable', 'The request allowance could not be verified. No Google request was sent.');
  }
}

export class RedisBudget implements BudgetStore {
  constructor(private url: string, private token: string, private key: string,
    public routeLimit: number, public nearbyLimit: number,
    public autocompleteLimit = 40, public detailsLimit = 20, private fetcher: typeof fetch = fetch) {}

  private command(command: (string | number)[]): Promise<unknown> {
    return redisCommand(this.url, this.token, command, this.fetcher);
  }

  async reserve(kind: BudgetKind, amount = 1): Promise<void> {
    if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Invalid reservation');
    const field = { route: 'routeCalls', nearby: 'nearbyCalls', autocomplete: 'autocompleteCalls', details: 'detailsCalls' }[kind];
    const limit = { route: this.routeLimit, nearby: this.nearbyLimit, autocomplete: this.autocompleteLimit, details: this.detailsLimit }[kind];
    const result = await this.command(['EVAL', RESERVE_SCRIPT, 1, this.key, field, amount, limit]);
    if (Array.isArray(result) && result[0] === 'exhausted') throw new ServiceError('budget-exhausted', 'The pilot request allowance is used up. Tutorial mode is still available.', 429);
    if (!Array.isArray(result) || result[0] !== 'ok') throw new ServiceError('budget-unavailable', 'The persistent request allowance needs setup or recovery. No Google request was sent.');
  }

  async snapshot(): Promise<BudgetSnapshot> {
    // Lua makes the no-expiry check and read consistent with concurrent updates.
    const raw = await this.command(['EVAL', "if redis.call('PTTL',KEYS[1]) ~= -1 then return false end return redis.call('GET',KEYS[1])", 1, this.key]);
    let data: Record<string, number>;
    try {
      if (typeof raw !== 'string') throw new Error();
      data = JSON.parse(raw);
      if (!data || fields.some(f => !Number.isSafeInteger(data[f]) || data[f] < 0)) throw new Error();
    } catch { throw new ServiceError('budget-unavailable', 'The persistent request allowance needs setup or recovery.'); }
    return { routeCalls: data.routeCalls, nearbyCalls: data.nearbyCalls, autocompleteCalls: data.autocompleteCalls, detailsCalls: data.detailsCalls,
      routeLimit: this.routeLimit, nearbyLimit: this.nearbyLimit, autocompleteLimit: this.autocompleteLimit, detailsLimit: this.detailsLimit,
      remainingComparisons: Math.max(0, this.routeLimit - data.routeCalls) };
  }
  async health(): Promise<{ready:boolean;issue?:'connection'|'missing'|'expiring'|'invalid'}> {
    let raw:unknown, ttl:unknown;
    try {
      raw = await this.command(['GET', this.key]);
      if (raw !== null) ttl = await this.command(['PTTL', this.key]);
    } catch { return {ready:false,issue:'connection'}; }
    if (raw === null) return {ready:false,issue:'missing'};
    if (ttl !== -1) return {ready:false,issue:ttl === -2 ? 'missing' : 'expiring'};
    if (typeof raw !== 'string') return {ready:false,issue:'invalid'};
    try {
      const data=JSON.parse(raw) as Record<string,unknown>;
      if (!data || fields.some(f=>!Number.isSafeInteger(data[f]) || Number(data[f])<0)) return {ready:false,issue:'invalid'};
    } catch { return {ready:false,issue:'invalid'}; }
    return {ready:true};
  }
  async canScan(count: number): Promise<boolean> {
    if (!Number.isSafeInteger(count) || count < 0) return false;
    return (await this.snapshot()).nearbyCalls + count <= this.nearbyLimit;
  }
  close() { /* The REST connection has no process-owned resources or counter reset. */ }
}
