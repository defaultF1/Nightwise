# Reproduce the research calculations

Run from the canonical NightWise root. These scripts read public OSM evidence or synthetic constants. Neither script calls Google, contacts a remote service, reads credentials or changes the application. They replace their corresponding research result JSON files.

`check-methods.cjs` uses Node built-ins only. It checks circle coverage, gap bounds and illustrative score interval arithmetic. Run with the bundled Node runtime.

`check-hours.cjs` requires the isolated research dependency `opening_hours` exactly 3.14.0. The existing installation is in `tmp/evidence-lab/node_modules`; supply that absolute directory through NODE_PATH when running the preserved copy. Do not add it to the app merely to reproduce this experiment. The evaluation date is fixed at 10 September 2026, 21:00 IST. Errors about missing Indian public holidays are expected and retained in the audit. This is a syntax/state projection, not an opening-hours verification service.

Source data: `../osm-candidates.json`, derived from the attributed OSM package. Outputs: `../osm-hours-parser-audit.json` and `../method-experiments.json` relative to this methods directory. Actual script paths are rooted from the repository working directory.

The parser package is LGPL-3.0-only with additional bundled component licences. Shipping it requires a separate dependency/licence review; its research use does not resolve that decision.
