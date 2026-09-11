from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
apk=json.loads((root/'output/apk/prebilling-verification.json').read_text())
status='''# NightWise current implementation status

Updated 9 September 2026 after the user authorized all work that does not require billing. Canonical folder: D:/Aevy TV ( Achina Mayya )/Nightwise. The user explicitly deferred physical-phone testing until later. Do not make Google API calls until billing is confirmed and testing resumes.

## Current milestone

M0–M3 are implemented and tested for the tutorial scope. M4/M5 now include prepared live search, local road classification, explicit provider pause controls and an updated verified APK. Live-service and intended-phone acceptance remain incomplete. M6 rehearsal materials and M7 source/deployment preparation are ready; the real rehearsal, container-host deployment and final live team acceptance are not complete.

| Stage | Current position |
| --- | --- |
| M0 foundation | Complete locally; source restoration instructions included |
| M1 shell and launch | Complete tutorial; original blue default, optional monochrome, local video |
| M2 journey and routes | Tutorial works; local pin search plus prepared Google destination search |
| M3 activity and scoring | Synthetic logic tested; live calibration and permitted-use question unresolved |
| M4 providers and limits | Code tested; all Google requests deliberately paused; real Google acceptance pending |
| M5 Android and handoff | APK verified; user deferred device connection and tests |
| M6 rehearsal | Recording script, phone checklist and ten-person sheet prepared; no field rehearsal |
| M7 delivery | Source ZIP and deployment recipe prepared; no HTTPS host or final live distribution |

The PDF has 12 functional modules, grouped by our stages. Frontend, backend, route fetcher, sampler, scanner, deduplicator, activity analyzer, stretch detector, scoring, explanations and handoff are implemented to their documented sample/live boundaries. PDF module 9 now has a conservative OSM road classifier and source data; actual provider-path matching and field accuracy remain unverified. A prepared feature is not a claim of live acceptance.

## Accepted journey and data behavior

AEOS (13.0628268, 77.5940888) to Manyata Tech Park (13.047697, 77.619939), using the user's supplied pins. Public gates and approaches still need confirmation. Driving is provisional. The full Bengaluru Google map remains supported when enabled; the local road-evidence extract is limited to North Bengaluru and returns unknown outside coverage.

Tutorial mode is the default and loads no Google map or provider API. Local search filters the two supplied locations and spelling aliases. Wider Bengaluru search is implemented with an explicit button, Autocomplete New and Place Details New, but disabled. A selection must resolve inside Bengaluru. Coordinate entry and optional one-time location remain available. No login, background tracking, community reporting, SOS or internal turn-by-turn navigation is added.

## Paused configuration and confidentiality

The browser, Android and separate server credentials are configured locally. Never copy their values to chat, reports, recovery notes or source exports. Server status now reports configured true, ready false, paused true. ENABLE_LIVE_REQUESTS, ENABLE_PLACE_SEARCH, ENABLE_ACTIVITY_ANALYSIS, ENABLE_EXPERIMENTAL_SCORING and VITE_ENABLE_LIVE_MAPS are all false. The frontend map switch is compiled into the APK and requires a rebuild to enable.

The user confirmed billing is not enabled. One earlier Routes attempt was rejected with provider-access; no diagnostic retry was made. The previous map load produced BillingNotEnabledMapError. This work made zero additional Google requests. The ledger remains routeCalls 1, nearbyCalls 0; missing autocomplete/detail counts in the old ledger mean zero and are preserved on migration. Map loads are separate from backend request counts.

## Implementation details that affect acceptance

Default limits: 10 route, 600 nearby, 40 autocomplete and 20 detail attempts total, with 120 nearby queries per comparison. Attempts count before dispatch, including failures. Search sessions expire after five minutes, allow at most six suggestion calls, and resolve only a returned ID once. No typing-triggered paid request, automatic retry or daily reset exists. Private access codes protect hosted comparisons and search; one instance owns the persistent ledger.

A single public Overpass request downloaded 13,542 road ways inside 13.02–13.085 N, 77.57–77.65 E. Raw data and provenance are in data/roads with ODbL attribution. The classifier uses explicit highway tags and geometry, keeps ambiguous parallel and grade-separated matches unknown, and requires 95 percent classified coverage before offering the road fraction to scoring. An OSM geometry smoke check returned 42.4 percent coverage on one way; this is self-consistency evidence only. It is not a measured live route or accuracy rate.

The data pipeline keeps incomplete scans and unknown hours separate. Longest and total low-activity distances are not asserted with incomplete evidence. Actual staffing, lighting, crime, public access and entrance availability are unmeasured. Live scoring remains disabled pending provider-use review and corridor calibration. Google provider content is not persisted to the OSM extract or budget ledger. Maps handoff sends endpoints and up to three live-path preview points; it can still change the corridor.

## Preview and Android artifact

Browser preview: http://localhost:4173 and http://127.0.0.1:4173. The existing preview remains running. Local API: http://127.0.0.1:8787, restarted with paused configuration. scripts/check-local-readiness.mjs checks local status without Google calls. Avoid duplicate preview/API processes; configuration changes require restarting the existing API.

Latest APK: output/apk/nightwise-prebilling-debug.apk, version 0.6.0-prebilling, package in.nightwise.demo. Signature, current web assets and server-key absence verified. No background-location permission. Earlier APKs remain preserved. scripts/connect-phone.ps1 -Install now targets this APK. No phone check was attempted after the user deferred it.

## Verification

65 unit/backend tests passed. The full browser run passed 31 checks in 5.2 minutes. An additional road-evidence browser check passed in 1.4 minutes. Provider responses and locations in browser tests are controlled fixtures, not Google or physical-device evidence. Paused routing/search/map checks verified zero provider calls. Both test runners closed successfully after slow browser-worker cleanup.

Android compiled successfully in 2 minutes 22 seconds. Gradle flatDir and SDK XML warnings remained non-fatal. An overstrict APK assertion initially rejected a dormant URL in Capacitor's web fallback; it was corrected to rely on runtime pause tests instead of claiming all library loader text must disappear. The packaged Node backend compiled and passed a separate paused-startup check. Docker is not installed, so the container image is prepared but not locally built or tested.

The previously noted three moderate development-chain npm advisories remain outside runtime scope; no dependency upgrade was performed during this work. APK/source verification records contain hashes and checks without secrets. Document page QA is recorded below after rendering.

## Remaining work and recovery

1. User enables billing and confirms testing may resume. Verify services and restrictions with one bounded route call; enable search and nearby scans separately. Keep experimental scoring off until evidence/use review is resolved.
2. User connects the intended Android phone later. Check permissions, native map layers, Back/resume and actual Maps handoff. Confirm both public gates.
3. Run the prepared real-corridor and reel rehearsal. Establish useful alternatives and sufficient opening-hours and road coverage before claiming a live recommendation.
4. Select and configure an HTTPS backend with persistent disk and a known egress IP. Test the prepared container on that host, migrate the existing ledger without resetting it, then rebuild for off-USB team use.

Read AGENTS.md, this status, planning/M04-live-setup.md, planning/M06-rehearsal-and-phone-checklist.md, planning/M07-hosting-and-team-handoff.md, research/billing-free-implementation-decisions.md and the two latest reports in talks. Older module reports preserve history and can contain superseded missing-key or zero-attempt statements. No credentials belong in recovery notes.
'''
(root/'planning/nightwise-current-status.md').write_text(status,encoding='utf-8')
for name in ['planning/nightwise-72-hour-modules.md','planning/M04-live-setup.md','talks/README.md','README.md']:
    p=root/name;s=p.read_text(encoding='utf-8',errors='replace').replace('\ufffd','–')
    note='''> Latest 9 September update: all three keys are configured privately; billing and phone tests are deferred. Google requests and embedded maps are explicitly paused. The latest APK is output/apk/nightwise-prebilling-debug.apk (0.6.0-prebilling). Search, OSM road classification, rehearsal materials and source/deployment preparation are implemented. Read planning/nightwise-current-status.md for current acceptance status; older statements below are historical.\n\n'''
    first=s.find('\n')+1;s=s[:first]+'\n'+note+s[first:];p.write_text(s,encoding='utf-8')
p=root/'planning/M04-live-setup.md';s=p.read_text();s+='''\n## Current switches before activation\n\nThe server credential is now present. Keep ENABLE_LIVE_REQUESTS=false, ENABLE_PLACE_SEARCH=false, ENABLE_ACTIVITY_ANALYSIS=false and ENABLE_EXPERIMENTAL_SCORING=false until the corresponding test is deliberately resumed. VITE_ENABLE_LIVE_MAPS=false prevents embedded map creation in the current web build and APK. Enabling maps requires rebuilding. No Cloud API test should be attempted while the user keeps billing paused. Search adds separate PILOT_AUTOCOMPLETE_LIMIT=40 and PILOT_DETAILS_LIMIT=20 counters; existing routeCalls=1 must be retained.\n''';p.write_text(s,encoding='utf-8')
p=root/'talks/README.md';s=p.read_text();s+='''\n## Latest billing independent checkpoints\n\n- [M4 and M5 search roads and Android](2026-09-09_M04-M05_billing-independent_v02.docx) · [Markdown](2026-09-09_M04-M05_billing-independent_v02.md)\n- [M6 and M7 rehearsal and handoff preparation](2026-09-09_M06-M07_rehearsal-and-handoff_v01.docx) · [Markdown](2026-09-09_M06-M07_rehearsal-and-handoff_v01.md)\n\nThe current implementation is ready for review without billing. Live-service, physical-phone, field-rehearsal and public-hosting acceptance remain pending. Screenshots are actual browser captures; road metrics in the new road panel screenshot are controlled fixtures.\n''';p.write_text(s,encoding='utf-8')
p=root/'.gitignore';p.write_text(p.read_text()+'\nbuild-server/\noutput/handoff/\n__pycache__/\n',encoding='utf-8')
record={'date':'2026-09-09','unitTestsPassed':65,'fullBrowserTestsPassed':31,'additionalRoadBrowserTestPassed':1,'androidBuild':'passed','physicalPhone':'deferred by user','googleRequestsThisWork':0,'priorRejectedRouteAttempts':1,'nearbyCalls':0,'autocompleteCalls':0,'detailsCalls':0,'roadWaysDownloaded':13542,'publicDeployment':False,'dockerImageTested':False,'apk':apk}
(root/'talks/records/prebilling-checkpoint.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print('Updated current status and recovery indexes without credential values.')
