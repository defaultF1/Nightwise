# Local implementation status

The local full-screen control is implemented for live maps, endpoint previews and the offline tutorial street diagram. Infrastructure layers are researched and specified, not installed in the app.

Checks on 14 September 2026:

- Production TypeScript/Vite build passed. Existing large-bundle warning remains.
- Five new browser checks passed: endpoint expansion in three themes, live route selection with the same mocked map instance and no extra compare calls, and offline tutorial expansion/minimize.
- Four existing confirmation-map and button-layout checks passed.
- Unit suite: 199 passed initially, with one timeout in the existing live-mode test. Its complete 25-test file passed on rerun, without changing that test or increasing the timeout.
- Inventory counts, uniqueness and unknown camera operating status were checked programmatically.
- Two local timing PDFs were text-extracted and visually checked; their creation metadata is March 2010.

Browser map checks use a provider mock and do not prove actual Google rendering. Android transparency is checked through DOM styles; a physical phone must still verify native composition, pan/zoom, marker taps, rotation and the hardware Back action. No paid Google comparison was made in this work. No APK, GitHub push or deployment was performed.

Source inventory: 2,722 surveillance records and 556 grouped signal records inside the existing AEOS 20 km circle, plus a 124-document citywide timing source register. The source footprints do not cover the complete service circle. These figures are not live route counts or a census of working equipment.

## Browser preview follow-up

The initially shared port 4175 was rejected by Google with `RefererNotAllowedMapError`. A real browser check on the existing local port 4173 successfully loaded Google Maps. Use `http://127.0.0.1:4173/`; Vite preview now defaults to that port and fails rather than silently choosing another port if it is occupied. No API key restriction was weakened.

The supplied AEOS and Manyata presets contain coordinates but no street-address text. The confirmation fallback now explains that the location is set by a map pin. This wording change does not claim a street address was retrieved or verified.
