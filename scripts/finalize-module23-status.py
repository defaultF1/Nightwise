"""Publish local milestone notes after completing document visual QA."""
from pathlib import Path
import json
import sys
root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2 or not sys.argv[1].isdigit():
    raise SystemExit('Pass the actual visually reviewed M03 page count')
pages=int(sys.argv[1])
apk=json.loads((root/'output/apk/module-03-verification.json').read_text())
status=f'''# NightWise current implementation status

Updated 9 September 2026 IST. Canonical project: D:/Aevy TV ( Achina Mayya )/Nightwise.

## Current milestone

M0, M1, M2 and M3 are complete within the credential-free tutorial scope. M4, M5, M6 and M7 remain. Optional iOS is after Android acceptance. This is a working app with calculated sample evidence, not a live routing or safety service.

| Module | Status | Evidence |
| --- | --- | --- |
| M0 foundation | Complete | Portable local tools, locked dependencies, Android compilation |
| M1 shell and launch | Complete | Blue default, remembered mono themes, native branding, launch and accessible sheets |
| M2 journey and routes | Complete | Both origins, AEOS pin, abortable provider, zero/one/two/three alternatives, synchronized diagram/cards/details/handoff; initial 4 unit and 4 browser tests passed |
| M3 activity comparison | Complete | Pure geometry, hours, deduplication, coverage, gaps and comparable experimental scoring; full suite 34 unit and 14 browser tests passed |
| M4 live services and budget | Next | Google credentials, provider adapters, real Bengaluru map, backend and budget limits |
| M5 Android device and handoff | Pending | Intended-phone installation, permissions, native Back/resume/map layering and Google Maps preview verification |
| M6 tutorial rehearsal | Pending | Real local journeys, intended phone and ten-user rehearsal |
| M7 final team package | Pending | Accepted final APK, source/configuration and known limitations |

## Preview and Android package

- Open http://localhost:4173 or http://127.0.0.1:4173 on this computer. The current preview runs as a hidden local Node process, bound only to 127.0.0.1. It was checked with HTTP 200.
- If stopped, run Preview NightWise.cmd in the project root. scripts/start-preview.ps1 checks an existing NightWise preview before starting one. It does not open network access. After source edits run npm run build to update the served dist folder.
- Latest review APK: output/apk/{apk['file']}. Package {apk['packageId']}, version {apk['versionName']}, {apk['sizeBytes']:,} bytes.
- Final Android build passed in 2 minutes 43 seconds. Signature, identity, four approved illustrations and the launch poster were verified. SHA256: {apk['sha256']}.
- output/apk/module-03-verification.json and module-03-package-verification.txt preserve verification. The earlier Module 1 APK remains as a historical checkpoint.
- No physical device or live services were tested. Do not present browser/compile checks as phone acceptance.

## Assets and design

The original navy/blue and teal theme is default, with persisted Mono Light and Mono Dark options. The supplied AEOS pin is 13.0628268, 77.5940888. Origins are Manyata Tech Park and Sahakar Nagar; driving is provisional and exact gates/entrance are unverified.

The existing Higgsfield launch video, crescent resources and 24-state concept pack were retained. Four final GPT Image 2.5 illustrations were generated and visually reviewed before M2/M3. A storefront revision removed unwanted baked-in hours and people. Estimated illustration use was 17.5 existing credits including the correction; no credits were purchased. See assets/README.md and assets/illustrations/*json. Only the approved v2 storefront is shipped; the initial image is archived under assets.

## Evidence and limits

The diagram uses explicitly illustrative polylines, not real Bengaluru streets. Journey durations and observations are synthetic. Counts, along-route coverage, gaps and comparisons are calculated from those inputs. The displayed sample clock is 9 September 2026, 8:30 pm IST.

Unknown, failed, capped and stale evidence stays separate from observed low activity. Numeric scores remain internal and uncalibrated; live-derived ranking is disabled. See planning/nightwise-activity-model.md for exact experimental constants and limitations. Real provider access, permitted data use, calibration and local route verification remain unresolved.

The final browser run exited successfully with 14 passed and a reported 5.5-hour elapsed time despite short case timings. The cause of that gap was not established; do not call it measured app latency or active implementation time.

## Handoffs and recovery

Latest: talks/2026-09-09_M03_activity-comparison_v01.docx plus Markdown. All {pages} final pages were rendered with the packaged renderer and visually inspected. The M2 report has two reviewed pages. Earlier P00/M00/M01 reports remain historical records.

Read AGENTS.md, this file, planning/nightwise-72-hour-modules.md and talks/README.md before resuming. Read the newest report and then the research/model notes. Source is in src; tests in tests/unit and tests/browser. Actual captures are in talks/screenshots/M02 and M03. No app source changes are required to replay this milestone.

No credentials are needed for the current review. Request restricted Google Cloud and backend access when starting M4 live calls. Use environment/secret settings, not chat. Do not start M4 merely because M3 finished; follow the user's next scope instruction.
'''
(root/'planning/nightwise-current-status.md').write_text(status,encoding='utf-8')
readme=root/'README.md'
readme.write_text('''# NightWise

Android-first Bengaluru route-comparison tutorial app for at most ten users. M0 through M3 are complete within the sample-data scope. Blue/navy is the default, with remembered Mono Light and Mono Dark themes.

## Review locally

Open http://localhost:4173 on this computer. If the preview has stopped, run [Preview NightWise.cmd](Preview%20NightWise.cmd). The helper starts a hidden server bound only to this computer. For source changes, run `npm run build` to update the preview. Use `npm run dev` on port 5173 for editing.

The working flow supports Manyata Tech Park and Sahakar Nagar to the supplied AEOS pin, route selection, calculated activity evidence, missing-data states and a Google Maps destination preview. Route geometry, times and observations are sample data. The real Bengaluru map, live places/routes and phone acceptance remain later modules.

Latest review package: [Module 3 Android debug APK](output/apk/nightwise-module-03-debug.apk). Signature, package identity and included assets were verified; physical-phone behavior is untested. See [verification](output/apk/module-03-verification.json).

## Tests and handoffs

`npm test` runs the pure logic checks. With the preview running, `npx playwright test` runs browser checks. The final M3 suite passed 34 unit tests and 14 browser tests. `npm run android:build` rebuilds the generic debug APK; preserve versioned module packages.

[M2 Word report](talks/2026-09-09_M02_journey-and-routes_v01.docx) and [M3 Word report](talks/2026-09-09_M03_activity-comparison_v01.docx) include implementation details, fixes, limits and actual screenshots. [Talks index](talks/README.md) keeps their Markdown companions and earlier checkpoints.

Read [current status](planning/nightwise-current-status.md), [module plan](planning/nightwise-72-hour-modules.md), [activity model](planning/nightwise-activity-model.md) and [AGENTS.md](AGENTS.md) to resume. Preparation and research remain in [planning](planning/README.md), [research](research/nightwise-bengaluru-research.md) and the [research PDF](output/pdf/nightwise-bengaluru-research.pdf).

All working files are local to D:/Aevy TV ( Achina Mayya )/Nightwise. API keys and billing remain deferred until M4. Optional iOS follows Android. Sample evidence never establishes real conditions or personal safety.
''',encoding='utf-8')
index=root/'talks/README.md'
text=index.read_text(encoding='utf-8').replace('| Complete — latest handoff | Both origins','| Complete | Both origins')
row='| [M03 activity comparison](2026-09-09_M03_activity-comparison_v01.docx) · [Markdown](2026-09-09_M03_activity-comparison_v01.md) | Complete — latest handoff | Calculated observations, coverage, gaps and comparisons; 34 unit and 14 browser tests; updated verified APK |'
lines=text.splitlines();where=next(i for i,line in enumerate(lines) if line.startswith('| [M02'))+1;lines.insert(where,row)
text='\n'.join(lines)+'\n'
text=text.replace('The latest APK is [nightwise-module-01-debug.apk](../output/apk/nightwise-module-01-debug.apk); its identity and signature evidence are in [module-01-verification.json](../output/apk/module-01-verification.json).','The latest APK is [nightwise-module-03-debug.apk](../output/apk/nightwise-module-03-debug.apk); its identity and signature evidence are in [module-03-verification.json](../output/apk/module-03-verification.json).')
text+=f'\nM2 and M3 handoff QA: both M2 pages and all {pages} M3 pages were rendered and visually reviewed. Actual application screenshots are under screenshots/M02 and screenshots/M03. M3 is the current browser and Android review milestone; live provider integration and physical-device validation are still pending.\n'
index.write_text(text,encoding='utf-8')
plan=root/'planning/nightwise-72-hour-modules.md';text=plan.read_text(encoding='utf-8');start=text.index('## Current status');end=text.index('This is the current delivery plan',start)
text=text[:start]+'''## Current status

M0 through M3 are complete within the sample-data scope. The final M3 suite passed 34 unit tests and 14 browser tests. The updated Android debug APK compiled and its signature, package version and bundled assets were verified. M2 and M3 Word handoffs were rendered and visually reviewed. See [current status](nightwise-current-status.md) and [talks](../talks/README.md) for evidence and recovery instructions.

M4 provider integration is next. Real Bengaluru map rendering, live routing/places, calibrated evidence, permitted scoring use, intended-phone behavior and local rehearsal remain unverified. No API keys or billing have been used for Maps services. The full reel tutorial requires M4–M7; iOS remains optional after Android acceptance.

'''+text[end:];plan.write_text(text,encoding='utf-8')
print('Updated current status, root README, module plan and talks index after document QA.')
