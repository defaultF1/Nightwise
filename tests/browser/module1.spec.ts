import { test, expect } from '@playwright/test';
import path from 'node:path';
const screenshots = path.resolve('tmp/browser-regression/M01');

test('black is the default and the local launch finishes without credentials', async ({ page }) => {
  const exceptions: string[] = [];
  page.on('pageerror', e => exceptions.push(e.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.launch-screen')).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /A little more insight/ })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText('Tutorial mode', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeEnabled();
  await page.screenshot({ path: path.join(screenshots, '01-dark-home.png'), fullPage: true });
  expect(exceptions).toEqual([]);
});

test('appearance changes immediately and is remembered after reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.launch-screen')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: path.join(screenshots, '02-appearance-settings.png'), fullPage: true });
  for (const [name, id] of [['Mono Light', 'light'], ['NightWise Blue', 'blue'], ['Mono Dark', 'dark']] as const) {
    await page.getByText(name, { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
    await page.screenshot({ path: path.join(screenshots, `03-${id}-home.png`), fullPage: true });
    await page.getByRole('button', { name: 'Open settings' }).click();
  }
  await page.getByText('NightWise Blue', { exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open settings' })).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue');
});

test('permission is optional and preview inputs remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('dialog')).toContainText('one-time location');
  await page.getByRole('button', { name: 'Choose a pin instead' }).click();
  await page.getByRole('button', { name: /AEOS Bengaluru/ }).click();
  await expect(page.getByRole('button', { name: /FROM AEOS/ })).toBeVisible();
  await page.getByRole('button', { name: 'About NightWise' }).click();
  await expect(page.getByRole('dialog')).toContainText('does not track your location');
});

test('narrow and desktop layouts have no horizontal overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 360, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Open settings' }).click();
    expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
  }
  await page.screenshot({ path: path.join(screenshots, '04-desktop-dark.png'), fullPage: true });
});

test('storage denial falls back to black and theme switching still works', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByText('Mono Light', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('a saved choice is restored before app code loads and after closing the page', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByText('NightWise Blue', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'blue');
  await page.close();
  const reopened = await context.newPage();
  await reopened.emulateMedia({ reducedMotion: 'reduce' });
  // Only the small HTML bootstrap executes: the saved appearance must already be applied.
  await reopened.route('**/assets/*.js', route => route.abort());
  await reopened.goto('/');
  await expect(reopened.locator('html')).toHaveAttribute('data-theme', 'blue');
  await expect(reopened.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#081725');
  await reopened.unroute('**/assets/*.js');
  await reopened.reload();
  await expect(reopened.getByRole('heading', { name: /A little more insight/ })).toBeVisible();
  await expect(reopened.locator('html')).toHaveAttribute('data-theme', 'blue');
});

// The Google billing-pause map flow was removed with the Geoapify build:
// live maps render from proxied tiles with no "Show Bengaluru map" gate.
