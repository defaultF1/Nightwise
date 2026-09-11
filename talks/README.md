## Latest Android map scroll correction

[M09 handoff](2026-09-10_M09_map-scroll-correction_v01.docx) and [Markdown](2026-09-10_M09_map-scroll-correction_v01.md). Android 0.11.3 corrects unnecessary native map layout requests and drops obsolete queued clipping positions. Four focused tests and APK verification passed; source c016cf7 is pushed. Physical scroll acceptance remains pending because the Redmi was disconnected. No Google calls or budget changes.

## Latest Kanpur live journeys and search

[M08 handoff](2026-09-10_M08_kanpur-live-search_v01.docx) and [Markdown](2026-09-10_M08_kanpur-live-search_v01.md). Android 0.11.2 is installed and verified. Actual Kanpur GPS/address, school search with driving estimate, three-route comparison and Maps handoff passed on the Redmi. Bengaluru presets and tutorial remain unchanged. See current status for the 155 unit/backend cases, nine browser cases, seven final smoke checks, real evidence coverage and remaining five route units.

## Latest offline tutorial and Android display release

[M07 handoff](2026-09-10_M07_offline-tutorial-and-live-scans_v01.docx) and [Markdown](2026-09-10_M07_offline-tutorial-and-live-scans_v01.md). Final Android 0.10.2 corrects Light native backgrounds, marker density and duplicate camera spacing. Real offline tutorial works both directions. Hosted scanner 0.10.0 completed the 0.10.1 Redmi live comparison. Evidence remains incomplete; read the [ten-row PDF table](../planning/2026-09-10_0100-pdf-checklist.md) and latest status for exact validation and usage.

## Latest phone and live acceptance

[M06 phone acceptance report](2026-09-10_M06_phone-acceptance_v01.docx) and [Markdown](2026-09-10_M06_phone-acceptance_v01.md). A real Redmi comparison returned three Google routes and live score ranges on 0.9.0. The 0.9.1 update fixes light-theme panel readability and reduces marker density; final device smoke and package checks passed. Physical Back, in-area GPS and exact road preservation in Google Maps remain unverified. Read current status for usage and build details.

## Latest live scoring implementation

[M06 live scoring report](2026-09-10_M06_live-scoring_v01.docx) and [Markdown](2026-09-10_M06_live-scoring_v01.md). Hosted software verification passed at 2026-09-10T09:25:55.299Z: 3 real routes, 3 score ranges, outcome insufficient. Software changes and verification are separate from physical acceptance. [Updated requirement table](../planning/2026-09-10_live-scoring-deliverables.md).

## Latest remaining deliverables research

[R01 research report](2026-09-10_R01_remaining-research_v01.docx) and [matching Markdown](2026-09-10_R01_remaining-research_v01.md): completed desk research against the PDF and agreed additions, 32 source entries, opening-hours parser results, proposed discovery/scoring/road/GPS/UI decisions and acceptance gates. [Evidence and execution materials](../research/evidence/2026-09-10/README.md) include an unsent provider review draft and 16-case field protocol. Research completion does not establish live score or field acceptance. No new Google usage or deployment in this pass.

## Hosted team APK work in progress

Android 0.8.1-team-preview now targets the Render HTTPS backend and waits for Free hosting cold starts. Render, Redis, server key, search and activity report ready; scoring remains off. Package verification passed. A physical hosted route test and Free cold-start observation remain before the Word hosting handoff is complete.

## Free hosting work in progress

[Free hosting checkpoint](2026-09-10_free-hosting-checkpoint.md): Render Free and Upstash Redis integration source pushed at 6a63aa1; live Redis migration and hosted APK acceptance remain pending. No Google requests used. Read this before the older completed hours report.

## Latest opening hours follow-up

[M04 and M05 opening hours and explanations](2026-09-10_M04_hours-and-explanations_v01.docx) ([Markdown](2026-09-10_M04_hours-and-explanations_v01.md)). Version 0.7.8 installed and live-tested. 110 unit/backend and 45 browser checks passed after correcting the paused-map test configuration. Live testing stays enabled; scoring remains withheld. Read the current planning status for measured coverage, budget and remaining acceptance. Older entries below are historical.

# Latest journey and Android handoff

10 September 2026: [Journey features and Android verification](2026-09-10_M05_journey-updates_v01.docx) and [Markdown](2026-09-10_M05_journey-updates_v01.md). Seven journey enhancements and native map/UI fixes are implemented. Read [current status](../planning/nightwise-current-status.md) for current APK, GitHub source, request allowance and uncompleted acceptance checks. Version 0.7.6 includes coloured pins and corrected confirmation contrast. Handoff screenshots distinguish real routes on 0.7.3 from final endpoint verification on 0.7.6.

# Latest handoff

10 September 2026: [Live integration test results](2026-09-10_M04_live-validation_v01.docx) and [Markdown](2026-09-10_M04_live-validation_v01.md). Maps, routes, search and provider scans passed integration checks; incomplete activity evidence prevents scoring acceptance. All 85 unit/backend and 38 browser tests passed. APK 0.6.3 was reverified, but no phone was connected. Live switches are paused again. This checkpoint supersedes earlier statements that all live checks are pending.

10 September 2026: [PDF offline implementation report](2026-09-10_PDF_offline-completion_v01.docx) and [Markdown source](2026-09-10_PDF_offline-completion_v01.md). Read [current status](../planning/nightwise-current-status.md) and [implementation decisions](../planning/pdf-implementation-decisions.md) first. Version 0.6.3 includes the offline PDF gap fixes; live validation, phone checks and deferred hosting remain. Reports below are historical and may describe superseded themes, APKs and acceptance status.

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

## Latest evidence checkpoint

[Hosted evidence follow-up](2026-09-10_hosted-evidence-followup.md): one authenticated comparison passed; coverage remains partial. Expanded road extract did not improve classification on the three tested routes. No score enablement or field validation.

[10 September public evidence collection](2026-09-10_public-evidence-checkpoint.md): incomplete live acceptance; 21 operator records, 671 OSM hours elements and expanded 10 km road evidence collected. No live-score enablement or new Google requests. [Detailed evidence package](../research/evidence/2026-09-10/README.md).

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

Opening-hours Word handoff QA: all three final pages were rendered and visually inspected. Source commit 6f0c6ae is published. Live testing remains enabled.
