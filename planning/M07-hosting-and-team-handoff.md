# NightWise hosting and team handoff

This is a prepared deployment package, not a public deployment. The current APK works independently for the bundled tutorial. Live use away from the computer requires an HTTPS backend, configured credentials, active billing and a new app build pointing to that backend.

## Local review

Open http://localhost:4173. The preview is served by the existing local Vite process; do not start another instance on that port. The backend is on 127.0.0.1:8787. `node scripts/check-local-readiness.mjs` reads configuration status and local request counts without calling Google. On a fresh session use Preview NightWise.cmd and Start NightWise API.cmd. Configuration changes require restarting the existing backend; the start script does not restart an already running process.

## Source restoration

The source ZIP deliberately excludes local environment files, Android credentials, signing keys, build caches, dependencies and compiled web assets. Copy .env.example to .env and supply values privately when needed. Run npm ci, npm test and npm run build. Browser preview uses npm run preview -- --port 4173. For Android, set up Java 21 and the Android SDK or use the included setup scripts, then run scripts/build-android.ps1. The original machine's private debug signing key is not exported; a new machine may produce a different certificate, requiring an updated Android key restriction and uninstall/reinstall on existing phones.

## Backend deployment recipe

The Dockerfile packages the backend and local road extract. It exposes port 8787 and runs as a non-root user. The container must run as one instance with a persistent writable disk mounted at /data. Choose a host with HTTPS termination, persistent storage and a known outbound IP; an ephemeral or automatically replicated filesystem cannot protect the pilot allowance. A provider account, hosting URL and any charges remain to be arranged. No provider was purchased or deployed during preparation.

Set the server environment through host secret settings. Required values are GOOGLE_MAPS_SERVER_KEY, HOST=0.0.0.0, PORT=8787, BUDGET_LEDGER_PATH=/data/pilot-budget.json and a PILOT_ACCESS_CODE of at least 16 characters. Set ALLOWED_ORIGINS to the exact web origin and the app origins https://localhost,http://localhost. Add the host's outbound public IP to the Google server-key restriction. Never put a server key in a VITE setting.

Start with ENABLE_LIVE_REQUESTS=false, ENABLE_PLACE_SEARCH=false, ENABLE_ACTIVITY_ANALYSIS=false and ENABLE_EXPERIMENTAL_SCORING=false. The health endpoint /api/status is available while paused and does not verify Google access. Use the prepared limits: 10 route attempts, 600 nearby attempts, 40 autocomplete attempts, 20 place-detail attempts and 120 nearby queries per comparison. Failures count; restarts never reset the allowance. Preserve the existing count of one earlier rejected route request when moving the pilot ledger to the host. Stop the local owner before migrating the ledger; never run two independent pilot budgets.

For a container-capable host: build the image using `docker build -t nightwise-api .`, attach its persistent disk and set the environment above. The current computer has no Docker executable, so the container image itself is not locally verified. The bundled Node backend is separately compiled and checked locally. Verify /api/status, blocked origins, access-code enforcement and persisted counts after restart before enabling provider requests.

## Activation and app rebuild

After the user confirms billing, enable ENABLE_LIVE_REQUESTS for one bounded route test. Enable search and activity separately only for their corresponding validation. ENABLE_EXPERIMENTAL_SCORING remains off until provider-use and corridor-calibration work are resolved. For an embedded map set VITE_ENABLE_LIVE_MAPS=true in the private frontend configuration and rebuild; the current APK deliberately keeps map creation off. Map loads have their own provider usage and are not counted by the backend ledger.

Set VITE_ANDROID_API_BASE_URL to the real HTTPS backend, supply the restricted client map keys and build the final APK. Browser keys need the final website origin. Android keys need the final package and certificate fingerprint. Share the pilot access code privately; it is kept only in the app session. Check the rebuilt APK away from USB before calling team live access complete.

## Final acceptance gate

The final team package requires successful live Routes and Places checks, understood coverage limits, a defensible scoring configuration, actual Android checks, confirmed public entrances and a recorded handoff rehearsal. M6 and M7 remain prepared checkpoints until these checks occur. Current artifacts must be described as the prebilling tutorial and source handoff, not as a completed live recommendation service.
