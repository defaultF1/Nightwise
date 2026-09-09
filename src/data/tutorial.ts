export const AEOS = { name: 'AEOS', latitude: 13.0628268, longitude: 77.5940888 } as const;
// Historical fixtures remain available to regression tests. The app uses AEOS -> Manyata.
export const origins = ['AEOS', 'Manyata Tech Park', 'Sahakar Nagar'] as const;
export type TutorialOrigin = typeof origins[number];
export type TutorialScenario = 'normal' | 'one' | 'three' | 'limited' | 'similar' | 'none' | 'error' | 'unknown' | 'capped' | 'closing' | 'detour';

// Route geometry is generated in providers/routes.ts. Activity observations are
// independently supplied by activity-fixtures.ts and analyzed by the domain layer.
