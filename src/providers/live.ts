import { Capacitor } from '@capacitor/core';
import type { LiveJourney } from '../domain/journey';
import type { LiveResult, ServiceStatus } from '../domain/live-contract';
import { JourneyError, validateRoutes } from './routes';
const ANDROID_FALLBACK_API_BASE = 'https://nightwise-f5fu.onrender.com';
const base = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_ANDROID_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || ANDROID_FALLBACK_API_BASE
  : import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://127.0.0.1:8787' : '');
export async function serviceStatus(signal?: AbortSignal): Promise<ServiceStatus> {
  const response = await fetch(`${base}/api/status`, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(65000)]) : AbortSignal.timeout(65000), cache: 'no-store' });
  if (!response.ok) throw new Error('Backend unavailable');
  const status = await response.json();
  if (typeof status.ready !== 'boolean' || typeof status.activityEnabled !== 'boolean') throw new Error('Unexpected backend');
  return status;
}
export async function liveComparison(journey: LiveJourney, signal: AbortSignal, accessCode: string): Promise<LiveResult> {
  const pin = (p:LiveJourney['origin'])=>({name:p.name,latitude:p.latitude,longitude:p.longitude});
  const payload={origin:pin(journey.origin),destination:pin(journey.destination),mode:journey.mode};
  let response: Response;
  try { response = await fetch(`${base}/api/compare`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessCode ? { 'X-Nightwise-Code': accessCode } : {}) }, body: JSON.stringify(payload), signal: AbortSignal.any([signal, AbortSignal.timeout(170000)]), cache: 'no-store' }); }
  catch { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); throw new JourneyError('unavailable', 'The live service could not be reached. Check the connection and backend. Your journey is saved.', true); }
  let data: any;
  try { data = await response.json(); } catch { throw new JourneyError('invalid-response', 'The live service returned an unreadable response.'); }
  if (!response.ok) throw new JourneyError('unavailable', typeof data.message === 'string' ? data.message.slice(0, 300) : 'Live routes are unavailable.', response.status >= 500);
  if (!Array.isArray(data.routes) || !Array.isArray(data.analyses) || !data.comparison || !Array.isArray(data.notices) || !Array.isArray(data.attributions) || !Number.isFinite(Date.parse(data.checkedAt))) throw new JourneyError('invalid-response', 'The live response was incomplete.');
  validateRoutes(data.routes);
  if (data.routes.some((r: any) => r.source !== 'google' || r.geometryKind !== 'provider')) throw new JourneyError('invalid-response', 'The live service did not return provider routes.');
  return data as LiveResult;
}
