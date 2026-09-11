import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const themes = [
  { id: 'dark', name: 'Mono Dark', description: 'Black surfaces, white details' },
  { id: 'light', name: 'Mono Light', description: 'White surfaces, black details' },
  { id: 'blue', name: 'NightWise Blue', description: 'Our original night palette' },
] as const;
export type Theme = typeof themes[number]['id'];
export const DEFAULT_THEME: Theme = 'dark';
const key = 'nightwise.appearance.v1';
const validTheme = (value: string | null): value is Theme => themes.some(t => t.id === value);
const colors: Record<Theme, string> = { dark: '#080808', light: '#f6f6f4', blue: '#081725' };
let pendingSave = Promise.resolve();

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(key);
    return validTheme(stored) ? stored : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
}
function mirrorTheme(theme: Theme) {
  try { localStorage.setItem(key, theme); } catch { /* The active theme still works for this session. */ }
}

export async function loadTheme(): Promise<Theme> {
  let theme = readTheme();
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key });
      if (validTheme(value)) theme = value;
      else await Preferences.set({ key, value: theme }); // Preserve the previous build's saved choice.
    } catch { /* Retain the browser mirror if native storage is unavailable. */ }
  }
  mirrorTheme(theme);
  return theme;
}

export function saveTheme(theme: Theme): Promise<void> {
  mirrorTheme(theme);
  if (Capacitor.isNativePlatform()) {
    pendingSave = pendingSave.then(() => Preferences.set({ key, value: theme })).catch(() => {});
  }
  return pendingSave;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.backgroundColor = colors[theme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme]);
}
