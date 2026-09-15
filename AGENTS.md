# Local development preference

As requested on 15 September 2026, development and testing stay local until the user explicitly approves publication again. Do not push commits/tags to GitHub, deploy hosting changes, or publish releases without a new explicit request. Local commits and branches are encouraged for rollback checkpoints.

Preserve existing private API configuration and credentials. Never commit secrets. Keep the current Google implementation available while researching or testing replacement providers; do not switch live services merely to demonstrate a different map renderer.

Checkpoint before map replacement research: `nightwise-local-before-map-replacement-2026-09-15`. It includes the tested wording cleanup and the CCTV/layers plan. Create future experiments on a local `codex/` branch. Preserve uncommitted work before any rollback; do not use destructive reset/clean commands as a shortcut.

16 September: use the user's Edge session for API-key/account setup. Provide Render and Upstash instructions to the user instead of changing those dashboards. Remove the team-code startup gate and code requirement for this migration. Prioritize the approximately 20 km AEOS–Manyata and Kanpur service areas; devices/networks must not be restricted to the developer's phone or Wi-Fi. Preserve budgets and rate limits. The user performs interactive phone testing; perform compilation/error checks without browser or phone test runs unless asked.
