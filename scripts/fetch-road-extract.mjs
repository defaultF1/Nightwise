// One deliberate public-data download. Never runs during an app comparison.
import { mkdir, writeFile, access } from 'node:fs/promises';
const file = new URL('../data/roads/north-bengaluru-overpass.json', import.meta.url);
try { await access(file); console.log('Existing road extract retained.'); process.exit(0); } catch {}
const query = '[out:json][timeout:35];way[highway](13.02,77.57,13.085,77.65);out geom;';
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'NightWiseLocalPilot/0.6 (one-time Bengaluru road research)' },
  body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(45000),
});
if (!response.ok) throw new Error(`Road extract HTTP ${response.status}; no automatic retry.`);
const data = await response.json();
if (data.remark || !Array.isArray(data.elements) || !data.elements.length) throw new Error('Incomplete road extract; not saved.');
await mkdir(new URL('../data/roads/', import.meta.url), { recursive: true });
await writeFile(file, JSON.stringify(data));
await writeFile(new URL('../data/roads/provenance.json', import.meta.url), JSON.stringify({
  retrievedAt: new Date().toISOString(), source: 'https://overpass-api.de/api/interpreter', query,
  attribution: '© OpenStreetMap contributors', license: 'ODbL 1.0', licenseUrl: 'https://www.openstreetmap.org/copyright',
  bounds: { south: 13.02, west: 77.57, north: 13.085, east: 77.65 }, elements: data.elements.length,
  purpose: 'Local road classification research around the supplied demonstration; not a routable map or field verification.',
}, null, 2));
console.log(JSON.stringify({ saved: true, roadWays: data.elements.length }));
