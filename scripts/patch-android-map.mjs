// Upstream 8.0.1 compares native LayoutParams (physical px) against CSS px.
// Keep this small, version-checked fix reproducible after npm ci and APK builds.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = new URL('../node_modules/@capacitor/google-maps/', import.meta.url);
const version = JSON.parse(readFileSync(new URL('package.json', base), 'utf8')).version;
if (version !== '8.0.1') throw new Error('Review the Android map layout patch before changing @capacitor/google-maps 8.0.1.');
const file = new URL('android/src/main/java/com/capacitorjs/plugins/googlemaps/CapacitorGoogleMap.kt', base);
const original = `                if (mapView.layoutParams.width != config.width || mapView.layoutParams.height != config.height) {
                    mapView.layoutParams.width = getScaledPixels(bridge, config.width)
                    mapView.layoutParams.height = getScaledPixels(bridge, config.height)
                    mapView.requestLayout()
                }`;
const corrected = `                // NightWise: compare physical pixels with physical pixels.
                val widthPx = getScaledPixels(bridge, config.width)
                val heightPx = getScaledPixels(bridge, config.height)
                if (mapView.layoutParams.width != widthPx || mapView.layoutParams.height != heightPx) {
                    mapView.layoutParams.width = widthPx
                    mapView.layoutParams.height = heightPx
                    mapView.requestLayout()
                }`;
const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
if (source.includes(corrected)) console.log('Android map pixel-size fix verified.');
else {
  if (source.split(original).length !== 2) throw new Error('Android map source changed; inspect the layout implementation before applying this fix.');
  writeFileSync(fileURLToPath(file), source.replace(original, corrected));
  console.log('Android map pixel-size fix applied.');
}
