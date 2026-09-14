import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const errors = new Set(); let mapScripts = 0;
page.on('console', message => {
  const match = message.text().match(/(?:Google Maps JavaScript API (?:error|warning):\s*)([A-Za-z]+)/);
  if (match) errors.add(match[1]);
});
page.on('request', request => { if (request.url().startsWith('https://maps.googleapis.com/maps/api/js?')) mapScripts++; });
try {
  await page.goto('http://localhost:4173');
  await page.getByRole('button', { name: 'Live routes', exact: true }).click();
  await page.getByRole('button', { name: 'Show Bengaluru map' }).click();
  await page.waitForTimeout(14000);
  const rendered = await page.locator('.gm-style').count() > 0;
  const mapFailure = await page.locator('.map-cover').innerText().catch(() => '');
  const images = await page.locator('.gm-style img').evaluateAll(images => images.filter(i => i.complete && i.naturalWidth > 0).length);
  await mkdir('talks/screenshots/M04', { recursive: true });
  await page.locator('.live-map').screenshot({ path: 'talks/screenshots/M04/02-real-browser-map-check.png' });
  const result = { checkedAt: new Date().toISOString(), mapScripts, rendered, loadedMapImages: images, providerErrorCodes: [...errors], mapFailure, liveRoutesTested: false, placesTested: false, keysPrinted: false };
  await writeFile('talks/records/M04-map-check.json', JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
