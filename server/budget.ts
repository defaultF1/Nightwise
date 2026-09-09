import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { ServiceError } from './errors';

// One local service owns this persistent pilot ledger. Never reset automatically.
// Charge an attempted request before dispatch: failures and cancellation still count.
export class Budget {
  private counts = { routeCalls: 0, nearbyCalls: 0, autocompleteCalls: 0, detailsCalls: 0 };
  private lock: string;
  constructor(private path: string, public routeLimit: number, public nearbyLimit: number, public autocompleteLimit=40, public detailsLimit=20) {
    mkdirSync(dirname(path), { recursive: true }); this.lock = path + '.lock';
    try { closeSync(openSync(this.lock, 'wx')); } catch { throw new Error('Budget ledger is already locked. Check whether another server is running.'); }
    try {
      if (existsSync(path)) {
        const data = JSON.parse(readFileSync(path, 'utf8'));
        if (!Number.isSafeInteger(data.routeCalls) || data.routeCalls < 0 || !Number.isSafeInteger(data.nearbyCalls) || data.nearbyCalls < 0) throw new Error('Invalid ledger');
        for(const field of ['autocompleteCalls','detailsCalls']) if(data[field]!==undefined&&(!Number.isSafeInteger(data[field])||data[field]<0))throw new Error('Invalid ledger');
        this.counts = { routeCalls: data.routeCalls, nearbyCalls: data.nearbyCalls, autocompleteCalls: data.autocompleteCalls??0, detailsCalls: data.detailsCalls??0 };
      } else this.persist();
    } catch { this.close(); throw new Error('Budget ledger cannot be read; live calls are disabled.'); }
  }
  private persist() { writeFileSync(this.path + '.tmp', JSON.stringify(this.counts), { mode: 0o600 }); renameSync(this.path + '.tmp', this.path); }
  reserve(kind: 'route' | 'nearby' | 'autocomplete' | 'details', amount = 1) {
    if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Invalid reservation');
    const key = ({route:'routeCalls',nearby:'nearbyCalls',autocomplete:'autocompleteCalls',details:'detailsCalls'} as const)[kind];
    const limit = {route:this.routeLimit,nearby:this.nearbyLimit,autocomplete:this.autocompleteLimit,details:this.detailsLimit}[kind];
    if (this.counts[key] + amount > limit) throw new ServiceError('budget-exhausted', 'The pilot request allowance is used up. Tutorial mode is still available.', 429);
    this.counts[key] += amount;
    try { this.persist(); } catch { throw new ServiceError('budget-unavailable', 'The request allowance could not be saved. No request was sent.'); }
  }
  canScan(count: number) { return this.counts.nearbyCalls + count <= this.nearbyLimit; }
  snapshot() { return { ...this.counts, routeLimit: this.routeLimit, nearbyLimit: this.nearbyLimit, autocompleteLimit:this.autocompleteLimit, detailsLimit:this.detailsLimit, remainingComparisons: Math.max(0, this.routeLimit - this.counts.routeCalls) }; }
  close() { try { unlinkSync(this.lock); } catch { /* Keep any other failure from hiding the original error. */ } }
}
