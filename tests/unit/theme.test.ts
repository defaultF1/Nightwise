import { beforeEach, afterEach, expect, test, vi } from 'vitest';

const native = vi.hoisted(() => ({ enabled: false, get: vi.fn(), set: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/preferences', () => ({ Preferences: { get: native.get, set: native.set } }));
import { loadTheme, readTheme, saveTheme } from '../../src/theme';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  native.enabled = false;
  native.get.mockReset().mockResolvedValue({ value: null });
  native.set.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());

test('new installs and invalid preferences start in black', async () => {
  expect(await loadTheme()).toBe('dark');
  localStorage.setItem('nightwise.appearance.v1', 'invalid');
  expect(readTheme()).toBe('dark');
});

test('Android restores its durable setting even when browser storage has been cleared', async () => {
  native.enabled = true;
  native.get.mockResolvedValue({ value: 'light' });
  expect(await loadTheme()).toBe('light');
  expect(readTheme()).toBe('light');
  expect(native.set).not.toHaveBeenCalled();
});

test('an existing blue choice migrates to native storage without being reset', async () => {
  native.enabled = true;
  localStorage.setItem('nightwise.appearance.v1', 'blue');
  expect(await loadTheme()).toBe('blue');
  expect(native.set).toHaveBeenCalledWith({ key: 'nightwise.appearance.v1', value: 'blue' });
});

test('quick appearance changes persist in order and restore the final choice', async () => {
  native.enabled = true;
  let saved: string | null = null;
  native.set.mockImplementation(async ({ value }) => { saved = value; });
  await Promise.all([saveTheme('light'), saveTheme('blue'), saveTheme('dark')]);
  native.get.mockImplementation(async () => ({ value: saved }));
  expect(await loadTheme()).toBe('dark');
  expect(native.set.mock.calls.map(([entry]) => entry.value)).toEqual(['light', 'blue', 'dark']);
});
