> Current handoff (10 September 2026): read [implementation status](planning/nightwise-current-status.md) and [PDF decisions](planning/pdf-implementation-decisions.md). Latest local APK: output/apk/nightwise-0.6.3-debug.apk. Black is the default, with persistent Light and Blue options; intro Skip is removed. Google calls remain paused. GitHub publishing and hosting are deferred. Older milestone details below are historical.

# NightWise

> Latest 9 September update: all three keys are configured privately; billing and phone tests are deferred. Google requests and embedded maps are explicitly paused. The latest APK is output/apk/nightwise-prebilling-debug.apk (0.6.0-prebilling). Search, OSM road classification, rehearsal materials and source/deployment preparation are implemented. Read planning/nightwise-current-status.md for current acceptance status; older statements below are historical.


Android-first Bengaluru route-comparison tutorial app for at most ten users. M0 through M3 are complete within the sample-data scope. Blue/navy is the default, with remembered Mono Light and Mono Dark themes.

## Review locally

Open http://localhost:4173 on this computer. If the preview has stopped, run [Preview NightWise.cmd](Preview%20NightWise.cmd). The helper starts a hidden server bound only to this computer. For source changes, run `npm run build` to update the preview. Use `npm run dev` on port 5173 for editing.

The working flow supports Manyata Tech Park and Sahakar Nagar to the supplied AEOS pin, route selection, calculated activity evidence, missing-data states and a Google Maps destination preview. Route geometry, times and observations are sample data. The real Bengaluru map, live places/routes and phone acceptance remain later modules.

Latest review package: [Module 3 Android debug APK](output/apk/nightwise-module-03-launchfix-debug.apk). Signature, package identity and included assets were verified; physical-phone behavior is untested. See [verification](output/apk/module-03-launchfix-verification.json).

Latest correction: [startup video Word report](talks/2026-09-09_M01_startup-video-fix_v02.docx). Refresh the page to see the intro. Reduced motion skips automatic playback; Settings > Replay intro starts it explicitly.

## Tests and handoffs

`npm test` runs the pure logic checks. With the preview running, `npx playwright test` runs browser checks. The M3 milestone passed 34 unit tests and 14 browser tests. The later startup correction passed 11 focused Edge checks; it plays the full generated intro and adds Settings > Replay intro. `npm run android:build` rebuilds the generic debug APK; preserve versioned module packages.

[M2 Word report](talks/2026-09-09_M02_journey-and-routes_v01.docx) and [M3 Word report](talks/2026-09-09_M03_activity-comparison_v01.docx) include implementation details, fixes, limits and actual screenshots. [Talks index](talks/README.md) keeps their Markdown companions and earlier checkpoints.

Read [current status](planning/nightwise-current-status.md), [module plan](planning/nightwise-72-hour-modules.md), [activity model](planning/nightwise-activity-model.md) and [AGENTS.md](AGENTS.md) to resume. Preparation and research remain in [planning](planning/README.md), [research](research/nightwise-bengaluru-research.md) and the [research PDF](output/pdf/nightwise-bengaluru-research.pdf).

All working files are local to D:/Aevy TV ( Achina Mayya )/Nightwise. API keys and billing remain deferred until M4. Optional iOS follows Android. Sample evidence never establishes real conditions or personal safety.
