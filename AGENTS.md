# Local development preference

As requested on 15 September 2026, development and testing stay local until the user explicitly approves publication again. Do not push commits/tags to GitHub, deploy hosting changes, or publish releases without a new explicit request. Local commits and branches are encouraged for rollback checkpoints.

Preserve existing private API configuration and credentials. Never commit secrets. Keep the current Google implementation available while researching or testing replacement providers; do not switch live services merely to demonstrate a different map renderer.

The user's acceptance requirement is to change the map while preserving the app's functionality: destination search, GPS, travel modes, routes and times, route-line selection, coloured business/help pins, opening-hours checks, activity scoring and navigation handoff. Treat missing capabilities or weaker data coverage as unresolved migration gaps, not acceptable feature removals. Do not claim parity until checked. Preserve source freshness and uncertainty; adding an unsupported number is not restored scoring. Evaluate provider licensing and capabilities before combining Google data with a non-Google map. All work remains local.

Checkpoint before map replacement research: `nightwise-local-before-map-replacement-2026-09-15`. It includes the tested wording cleanup and the CCTV/layers plan. Create future experiments on a local `codex/` branch. Preserve uncommitted work before any rollback; do not use destructive reset/clean commands as a shortcut.
