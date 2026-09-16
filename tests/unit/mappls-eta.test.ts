import { test, expect, vi } from 'vitest';
import { mapplsLiveSeconds } from '../../server/mappls-eta';

const points = [{ latitude: 13.0628, longitude: 77.5941 }, { latitude: 13.055, longitude: 77.607 }, { latitude: 13.0477, longitude: 77.6199 }];
const ok = (duration: number) => new Response(JSON.stringify({ code: 'Ok', routes: [{ duration }] }));

test('returns live seconds for a guided route and caches repeats', async () => {
  const fetcher = vi.fn(async () => ok(963.4));
  const signal = new AbortController().signal;
  expect(await mapplsLiveSeconds('key', 'DRIVE', points, signal, fetcher as unknown as typeof fetch)).toBe(963);
  expect(await mapplsLiveSeconds('key', 'DRIVE', points, signal, fetcher as unknown as typeof fetch)).toBe(963);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const url = String(fetcher.mock.calls[0][0]);
  expect(url).toContain('route_eta/driving/');
  expect(url).toContain('77.594100,13.062800;77.607000,13.055000;77.619900,13.047700');
  expect(url).toContain('alternatives=false');
});

test('never breaks the comparison: bad responses, errors and bad inputs all yield null', async () => {
  const signal = new AbortController().signal;
  for (const respond of [async () => new Response('{}', { status: 401 }), async () => new Response('{"code":"NoRoute"}'), async () => new Response(JSON.stringify({ code: 'Ok', routes: [{ duration: -5 }] })), async () => { throw new Error('offline'); }]) {
    expect(await mapplsLiveSeconds('key', 'DRIVE', [{ latitude: 13.06 + Math.random() * 0.001, longitude: 77.59 }, points[2]], signal, respond as unknown as typeof fetch)).toBeNull();
  }
  expect(await mapplsLiveSeconds('', 'DRIVE', points, signal)).toBeNull();
  expect(await mapplsLiveSeconds('key', 'DRIVE', [points[0]], signal)).toBeNull();
});

test('walking uses the advanced pedestrian resource', async () => {
  const fetcher = vi.fn(async () => ok(4800));
  expect(await mapplsLiveSeconds('key', 'WALK', [points[0], { latitude: 13.0551, longitude: 77.6072 }], new AbortController().signal, fetcher as unknown as typeof fetch)).toBe(4800);
  expect(String(fetcher.mock.calls[0][0])).toContain('route_adv/walking/');
});
