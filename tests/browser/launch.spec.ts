import { test, expect } from '@playwright/test';
import path from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

test('the generated video advances and finishes before the app opens', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).launchFinished = null;
    document.addEventListener('ended', event => {
      if (event.target instanceof HTMLVideoElement) (window as any).launchFinished = { time: event.target.currentTime, duration: event.target.duration };
    }, true);
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.launch-screen')).toHaveAttribute('data-playback', 'playing');
  await expect(page.getByRole('button', { name: 'Skip', exact: true })).toHaveCount(0);
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(1.5);
  await page.locator('video').evaluate((v: HTMLVideoElement) => v.pause());
  expect(await page.locator('video').evaluate((v: HTMLVideoElement) => v.muted && v.videoWidth === 720)).toBeTruthy();
  await page.screenshot({ path: path.resolve('tmp/browser-regression/M01/05-launch-playing.png') });
  await page.locator('video').evaluate((v: HTMLVideoElement) => v.play());
  await expect(page.locator('.launch-screen')).toHaveCount(0, { timeout: 15000 });
  const ended = await page.evaluate(() => (window as any).launchFinished);
  expect(ended.duration).toBeGreaterThan(4);
  expect(ended.time).toBeCloseTo(ended.duration, 1);
  await expect(page.getByRole('heading', { name: /A little more insight/ })).toBeFocused();
});

test('slow media loading does not dismiss the intro after 1.2 seconds', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/nightwise-launch-navy-concept.mp4', async route => { await gate; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.launch-screen')).toBeVisible();
  await page.waitForTimeout(1600);
  await expect(page.locator('.launch-screen')).toHaveAttribute('data-playback', 'loading');
  release();
  await expect(page.locator('.launch-screen')).toHaveAttribute('data-playback', 'playing');
  await expect(page.locator('.launch-screen')).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeEnabled();
});

test('blocked autoplay offers a user initiated Play intro action', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) { first = false; return Promise.reject(new DOMException('Test autoplay policy', 'NotAllowedError')); }
      return original.call(this);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play intro' })).toBeVisible();
  await page.getByRole('button', { name: 'Play intro' }).click();
  await expect(page.locator('.launch-screen')).toHaveAttribute('data-playback', 'playing');
  await page.keyboard.press('Escape');
  await expect(page.locator('.launch-screen')).toBeVisible();
  await expect(page.locator('.launch-screen')).toHaveCount(0, { timeout: 15000 });
});

test('reduced motion bypasses autoplay but allows explicit replay from settings', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.launch-screen')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Replay intro' }).click();
  await expect(page.locator('.launch-screen')).toHaveAttribute('data-playback', 'playing');
  await expect(page.locator('.launch-screen')).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeEnabled();
});

test('unavailable video uses the static brand and still opens the app', async ({ page }) => {
  await page.route('**/nightwise-launch-navy-concept.mp4', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.launch-screen')).toHaveAttribute('data-playback', 'unavailable');
  await expect(page.locator('.launch-brand')).toContainText('NightWise');
  await expect(page.locator('.launch-screen')).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeEnabled();
});

test('a video request that never resolves cannot trap the user on launch', async ({ page }) => {
  await page.clock.install();
  await page.route('**/nightwise-launch-navy-concept.mp4', () => {});
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.launch-screen')).toBeVisible();
  await page.clock.fastForward(10001);
  await expect(page.locator('.launch-screen')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeEnabled();
});

test('continuing playback is not cut off by a fixed launch timer', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  await page.goto('/');
  const video = page.locator('video');
  await video.dispatchEvent('playing');
  for (const time of [1, 2, 3]) {
    await page.clock.fastForward(8000);
    await video.evaluate((element, value) => {
      Object.defineProperty(element, 'currentTime', { configurable: true, value });
      element.dispatchEvent(new Event('timeupdate'));
    }, time);
    await expect(page.locator('.launch-screen')).toBeVisible();
  }
  await video.dispatchEvent('ended');
  await expect(page.locator('.launch-screen')).toHaveCount(0);
});

test('stalled playback still opens the app instead of trapping the user', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  await page.goto('/');
  await page.locator('video').dispatchEvent('playing');
  await page.clock.fastForward(12001);
  await expect(page.locator('.launch-screen')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compare night routes' })).toBeEnabled();
});
