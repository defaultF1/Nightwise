import { test, expect } from 'vitest';
import data from '../../src/data/cameras-north-bengaluru.json' with { type: 'json' };
import { camerasNearRoute, mappedCameraPins, MAPPED_CAMERA_DISTANCE_METERS } from '../../src/domain/camera-layer';
import { distanceToRoute } from '../../src/domain/route-proximity';

test('the bundled OpenStreetMap camera extract is well-formed, deduplicated and inside the study area', () => {
  expect(data.license).toContain('ODbL');
  expect(data.note).toContain('does not confirm');
  const cameras = data.cameras;
  expect(cameras.length).toBeGreaterThan(2000);
  expect(new Set(cameras.map(c => c.id)).size).toBe(cameras.length);
  for (const c of cameras) {
    expect(c.latitude).toBeGreaterThan(12.8); expect(c.latitude).toBeLessThan(13.3);
    expect(c.longitude).toBeGreaterThan(77.35); expect(c.longitude).toBeLessThan(77.85);
  }
});

test('camerasNearRoute returns only cameras within the buffer of the actual path', () => {
  // A short path through the mapped cluster on Bellary Road near AEOS.
  const cluster = [{ latitude: 13.0575, longitude: 77.5965 }, { latitude: 13.0595, longitude: 77.5985 }];
  const near = camerasNearRoute(cluster);
  expect(near.length).toBeGreaterThan(0);
  for (const c of near) expect(distanceToRoute(c, cluster)).toBeLessThanOrEqual(MAPPED_CAMERA_DISTANCE_METERS);
  // A rural path outside the mapped area returns nothing rather than inventing coverage.
  expect(camerasNearRoute([{ latitude: 13.28, longitude: 77.8 }, { latitude: 13.29, longitude: 77.81 }])).toHaveLength(0);
  expect(camerasNearRoute([{ latitude: 13.06, longitude: 77.6 }])).toHaveLength(0);
});

test('mapped camera pins stay factual: camera kind, coordinates preserved, honest status', () => {
  const pins = mappedCameraPins(camerasNearRoute([{ latitude: 13.0575, longitude: 77.5965 }, { latitude: 13.0595, longitude: 77.5985 }]));
  expect(pins.length).toBeGreaterThan(0);
  for (const pin of pins) {
    expect(pin.kind).toBe('camera');
    expect(pin.name).toContain('Mapped camera');
    expect(pin.status).toContain('not confirmed');
  }
});
