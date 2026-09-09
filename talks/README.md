# NightWise module handoffs

> Latest 9 September update: all three keys are configured privately; billing and phone tests are deferred. Google requests and embedded maps are explicitly paused. The latest APK is output/apk/nightwise-prebilling-debug.apk (0.6.0-prebilling). Search, OSM road classification, rehearsal materials and source/deployment preparation are implemented. Read planning/nightwise-current-status.md for current acceptance status; older statements below are historical.


This folder holds a Word report after every completed module, plus explicitly labelled checkpoints for partial work. The user requested this record on 9 September 2026 so the project can resume after context loss.

## Recovery order

1. Read ../AGENTS.md for ongoing instructions.
2. Read ../planning/nightwise-current-status.md and ../planning/nightwise-72-hour-modules.md for current status and scope.
3. Read the newest report and its Markdown source here. Follow its next steps and verify actual files before acting.
4. Consult ../planning for UX, decisions and validation; consult ../research for evidence and provider constraints.

## Report contents

Module and status; completed work; approach and reasons; decisions; errors, known or suspected causes and fixes; validation with evidence; useful screenshots with captions; file references; remaining work and next actions; help needed from the user. Include date and revision. Never include secrets.

Use YYYY-MM-DD_M01_app-shell_v01.docx and preserve prior revisions. Screenshots belong in talks/screenshots with descriptive filenames. Matching Markdown sources allow quick reading when context is lost. Rendering artifacts stay under tmp and are not handoff reports.

## Index

| Report | Status | Purpose |
| --- | --- | --- |
| [P00 preparation checkpoint](2026-09-09_P00_preparation_v01.docx) Â· [Markdown](2026-09-09_P00_preparation_v01.md) | Historical checkpoint | Research/design decisions and setup issues before M0 finished; pending statements describe that earlier checkpoint |
| [M00 build foundation](2026-09-09_M00_build-foundation_v01.docx) Â· [Markdown](2026-09-09_M00_build-foundation_v01.md) | Complete | Local tools, dependencies and first successful Android compilation |
| [M01 app shell](2026-09-09_M01_app-shell_v01.docx) Â· [Markdown](2026-09-09_M01_app-shell_v01.md) | Complete | Blue default, two optional monochrome themes, launch, accessible shell, five passing browser tests and verified branded APK |
| [M02 journey and routes](2026-09-09_M02_journey-and-routes_v01.docx) Â· [Markdown](2026-09-09_M02_journey-and-routes_v01.md) | Complete | Both origins, validated sample route provider, selectable diagram, cancellation and retry; four unit and four browser tests passed; both report pages visually checked |
| [M03 activity comparison](2026-09-09_M03_activity-comparison_v01.docx) Â· [Markdown](2026-09-09_M03_activity-comparison_v01.md) | Complete â€” comparison milestone | Calculated observations, coverage, gaps and comparisons; 34 unit and 14 browser tests; updated verified APK |
| [M01 startup video correction](2026-09-09_M01_startup-video-fix_v02.docx) Â· [Markdown](2026-09-09_M01_startup-video-fix_v02.md) | Complete â€” latest correction | Full video playback, autoplay recovery, replay, eleven passing browser checks and verified APK revision |

Actual Module 1 browser screenshots and a launch frame are in [screenshots/M01](screenshots/M01). The latest APK is [nightwise-module-03-launchfix-debug.apk](../output/apk/nightwise-module-03-launchfix-debug.apk); its identity and signature evidence are in [module-03-launchfix-verification.json](../output/apk/module-03-launchfix-verification.json). Physical-phone and live-service validation remain pending.

Final document QA completed on 9 September 2026: all four P00 pages, both M00 pages and all five M01 pages were rendered and visually inspected. Research/design images are labelled as concepts; M01 images are actual browser screenshots. Internal PDF/page renders remain under tmp/docx-qa.

## Latest user decisions

- Original blue/navy and teal is the default theme.
- Add Mono Light and Mono Dark as optional appearances; persist the user's choice locally.
- Write a Word report here after every completed module.

M2 and M3 handoff QA: both M2 pages and all 4 M3 pages were rendered and visually reviewed. Actual application screenshots are under screenshots/M02 and screenshots/M03. M3 is the current browser and Android review milestone; live provider integration and physical-device validation are still pending.

Startup correction QA: both final M01 revision 2 pages were rendered and visually inspected. Its screenshot shows actual browser playback. The corrected APK signature, current web bundle and generated clip were independently verified.


## Latest M4 and M5 implementation checkpoints

These reports supersede the older next-module statements above. M4 and M5 have implemented code, not completed live/device acceptance.

| Report | Status | Scope |
| --- | --- | --- |
| [M04 provider integration](2026-09-09_M04_provider-integration_checkpoint_v01.docx) â€“ [Markdown](2026-09-09_M04_provider-integration_checkpoint_v01.md) | Implementation checkpoint; live acceptance pending | Backend, Google adapters, persistent request allowance, live/sample UI, actual billing error and setup instructions |
| [M05 Android handoff](2026-09-09_M05_android-handoff_checkpoint_v01.docx) â€“ [Markdown](2026-09-09_M05_android-handoff_checkpoint_v01.md) | APK verified; phone acceptance pending | Native map/location/Back/resume/handoff code, verified APK, browser proof and required device checks |

Current APK: ../output/apk/nightwise-module-05-pilot-debug.apk. Version 0.5.0-pilot. See module-05-verification.json for signature, SHA-256 and bundle checks. Updated demonstration: AEOS to the supplied Manyata pin; full Bengaluru map. Local preview remains http://localhost:4173 . Both computer-control bridges are unavailable. Billing, server credential, provider-use/calibration and physical-phone checks remain outstanding. No Routes or Places calls were made.

The M4 and M5 reports each have two pages. Final visual-review status is recorded in planning/nightwise-current-status.md after QA. Credentials are excluded from all Word reports, Markdown notes and JSON handoff records.

Final M4/M5 document QA: all four final pages were rendered and visually reviewed. M4 screenshots include the actual Google billing error and a controlled missing-key browser state; M5 uses an explicitly labelled mocked-route browser handoff. No screenshot is presented as a physical-phone test.

## Latest billing independent checkpoints

- [M4 and M5 search roads and Android](2026-09-09_M04-M05_billing-independent_v02.docx) · [Markdown](2026-09-09_M04-M05_billing-independent_v02.md)
- [M6 and M7 rehearsal and handoff preparation](2026-09-09_M06-M07_rehearsal-and-handoff_v01.docx) · [Markdown](2026-09-09_M06-M07_rehearsal-and-handoff_v01.md)

The current implementation is ready for review without billing. Live-service, physical-phone, field-rehearsal and public-hosting acceptance remain pending. Screenshots are actual browser captures; road metrics in the new road panel screenshot are controlled fixtures.

Final document QA: both pages of each new Word checkpoint were rendered and visually reviewed. The M4/M5 screenshot layout was tightened to remove footer crowding. All four final pages are clean. The final source package includes the reviewed Word reports and updated recovery records.
