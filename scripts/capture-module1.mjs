import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
const out = path.resolve('talks/screenshots/M01');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('heading', { name: /A little more insight/ }).waitFor();
  await page.screenshot({ path: path.join(out, '01-blue-home.png'), fullPage: true });
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.screenshot({ path: path.join(out, '02-appearance-settings.png') });
  for (const [name, id] of [['Mono Light', 'light'], ['Mono Dark', 'dark']]) {
    await page.getByText(name, { exact: true }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.screenshot({ path: path.join(out, `03-${id}-home.png`), fullPage: true });
    await page.getByRole('button', { name: 'Open settings' }).click();
  }
  await context.close();
  const media = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await media.goto('http://127.0.0.1:4173/assets/launch/nightwise-launch-navy-concept.mp4');
  await media.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  const details = await media.locator('video').evaluate(video => ({ duration: video.duration, width: video.videoWidth, height: video.videoHeight }));
  await fs.writeFile(path.join(out, 'launch-metadata.json'), JSON.stringify(details, null, 2));
  await media.locator('video').evaluate(video => { video.pause(); video.controls = false; video.currentTime = 1; });
  await media.waitForFunction(() => !document.querySelector('video').seeking);
  await media.locator('video').screenshot({ path: path.join(out, '05-launch-background.png') });
  console.log(JSON.stringify({ screenshots: out, video: details }));
} finally { await browser.close(); }
