from pathlib import Path
import json, sys
import runpy
build=runpy.run_path(str(Path(__file__).with_name('write-module-report.py')))['build']
root=Path(__file__).resolve().parents[1]
def p(text):return {'type':'paragraph','text':text}
def h(text):return {'type':'heading','text':text}
def bullet(text):return {'type':'bullet','text':text}
apk=json.loads((root/'output/apk/prebilling-verification.json').read_text())
reports=[{
 'filename':'2026-09-09_M04-M05_billing-independent_v02.docx',
 'title':'NightWise search roads and Android checkpoint',
 'meta':'9 September 2026   M4 and M5 revision 2   Live and phone acceptance pending',
 'blocks':[
 p('We completed the implementation and checks that can proceed while Google billing is paused. The app now searches the supplied demo pins locally, has a prepared Bengaluru place-search connection, and estimates road classes using a local OpenStreetMap extract. The updated Android APK is built and verified. These results do not establish a working live recommendation or a physical-phone pass.'),
 h('Search and cost controls'),
 p('Local filtering handles AEOS, Manyata and common spelling variants without a request. Wider search runs only after the user presses Search Bengaluru. Its Google Autocomplete and Place Details adapters use bounded sessions, allow only offered place IDs and enforce a Bengaluru coordinate check. Persistent limits allow 40 suggestion attempts and 20 detail attempts across the pilot. Existing route and nearby counts are preserved when reading the older ledger.'),
 p('A server pause switch blocks Routes and Places requests before dispatch. A separate build setting blocks embedded Google map creation on web and Android. All these switches remain off. The server credential is configured privately; no key values are in this report, screenshots or source exports. The ledger still contains one earlier rejected route attempt and zero nearby, autocomplete and detail attempts.'),
 h('Road classification approach'),
 p('One public Overpass download supplied 13,542 mapped road ways around the North Bengaluru corridor. The raw data and provenance remain local with OpenStreetMap attribution. The classifier uses highway tags, distance and alignment. Conflicting parallel roads, bridges, tunnels and unmatched sections remain unknown. At least 95 percent classified coverage is required before passing a main-road fraction to the score model. These thresholds still need real-corridor calibration.'),
 h('Verification and known limits'),
 p('All 65 unit and backend tests passed. The full browser run reported 31 passing checks and the additional road-evidence check passed. Browser results use controlled provider fixtures. The test workers were slow to close after completion; this was investigated as test-browser cleanup, not represented as a phone test. The OSM file smoke test measured 42 percent classified coverage on one map way, illustrating the conservative unknown handling; it is not field accuracy evidence.'),
 {'type':'page'},h('Actual application evidence'),
 {'type':'image_pair','height':3.0,'images':[{'path':'talks/screenshots/prebilling/01-place-search-report.png','caption':'Actual browser search controls with wider search paused.'},{'path':'talks/screenshots/prebilling/03-road-evidence-mocked.png','caption':'Actual road-evidence component with controlled test values.'}],'caption':'Browser screenshots. Search is genuinely paused. Road distances and 64 percent coverage on the right are test fixtures, not measured AEOS to Manyata results.'},
 h('Android package and errors'),
 p('Version '+apk['versionName']+' compiled successfully in 2 minutes 22 seconds. The APK signature and packaged web assets were checked, and the server key is absent. No background-location permission is present. A first static check incorrectly expected every Google loader URL to disappear; Capacitor retains dormant loader code. The check was corrected to distinguish packaged library text from runtime invocation, which the paused-map browser test verifies.'),
 p('Physical-phone testing was deferred by the user. Gradle flatDir and SDK XML-version warnings remained non-fatal. Initial patch applications that did not match source text made no edits and were corrected. Search sessions, paused calls, malformed data, missing road coverage and parallel-road ambiguity are covered by tests.'),
 p('Important files: src/PlaceSearch.tsx, src/PointPicker.tsx, src/domain/roads.ts, server/search.ts, server/roads.ts, server/budget.ts and output/apk/nightwise-prebilling-debug.apk. Open planning/M04-live-setup.md for future activation. Billing, successful provider access, live scoring review and calibration, and the intended-phone checks remain outstanding.')
 ]},
 {'filename':'2026-09-09_M06-M07_rehearsal-and-handoff_v01.docx',
 'title':'NightWise rehearsal and team handoff preparation',
 'meta':'9 September 2026   M6 and M7 preparation checkpoint   Field rehearsal and deployment pending',
 'blocks':[
 p('The rehearsal materials and source handoff are prepared for the Bengaluru reel. The bundled tutorial can be reviewed without Google billing. The user chose to connect the Android phone later, so this checkpoint does not claim an installation, field rehearsal or public deployment.'),
 h('Recording plan'),
 p('Use the AEOS to Manyata demonstration. The prepared sequence covers the launch, destination selection, route cards, activity details, time tradeoff and Google Maps preview in approximately 45 seconds. Keep the Sample data label visible for a tutorial recording. Real route times, business counts, road coverage and recommendations must come from the later validated live run.'),
 bullet('Open the destination picker and demonstrate local search for Manyata. Wider Bengaluru search stays paused. Confirm the public entrances before filming an actual trip.'),
 bullet('Show both the time difference and uncertainty. Rehearse missing evidence, closing-soon places, similar options and substantial detours so the presenter can explain them accurately.'),
 bullet('In the handoff screen explain that navigation continues in Google Maps and the corridor may change. The fictional tutorial path is never sent as a real road route.'),
 h('Phone and participant checks'),
 p('planning/M06-rehearsal-and-phone-checklist.md covers launch playback, permissions, Back, resume, themes, scrolling, map layering and the real handoff. scripts/connect-phone.ps1 now installs the latest prebilling APK when one authorized phone is connected. The ten-participant CSV starts entirely NOT TESTED and records usability outcomes without names or exact journey histories.'),
 p('The phone check and corridor rehearsal remain blocked on the user supplying the device and confirming the real entrances. Live comparisons additionally require active billing. These are explicit remaining dependencies, not completed tests.'),
 {'type':'page'},h('Prepared delivery package'),
 p('The APK is output/apk/nightwise-prebilling-debug.apk. It contains the local launch and tutorial, local pin search, prepared live search and road-evidence interfaces. Its package ID is in.nightwise.demo and its version is '+apk['versionName']+'. Live embedded maps remain paused. The source ZIP is generated from an explicit file list; it excludes credentials, signing keys, dependencies, caches and compiled web assets.'),
 h('Backend preparation'),
 p('npm run build:server creates a standalone Node backend entrypoint. A separate local startup check confirmed that this packaged entrypoint serves status while paused and makes no Google requests. The Dockerfile packages the backend with the local OSM extract and runs as a non-root user. Docker is unavailable on this computer, so the container image itself is not claimed tested.'),
 p('Team live use needs an HTTPS host, one backend instance, a persistent writable budget disk, the actual app origins and a private team access code. The current service is only local. The deployment guide explains these settings, migration of the existing request counts, host IP restrictions and rebuilding the APK against the final HTTPS URL. No hosting subscription or public deployment was created.'),
 h('Next activation sequence'),
 p('When the user confirms billing, validate a single Routes request first. Enable place search and nearby scans separately within their limits. Check opening-hours coverage and actual corridor matches before enabling experimental scoring. Then install on the intended phone, inspect Google Maps previews at both entrances, rehearse the reel and prepare the final live APK. Billing activation alone does not complete these checks.'),
 h('Recovery references'),
 p('Read planning/nightwise-current-status.md, planning/M07-hosting-and-team-handoff.md, planning/M06-rehearsal-and-phone-checklist.md, research/billing-free-implementation-decisions.md and the latest talks reports. The research note links the official Google, OSM and Overpass sources and preserves the outstanding provider-use question. All project files remain under D:/Aevy TV ( Achina Mayya )/Nightwise.')
 ]}]
for report in (reports[:1] if '--only-m4' in sys.argv else reports):
    source=root/'talks/records'/ (Path(report['filename']).stem+'.json')
    source.write_text(json.dumps(report,indent=2),encoding='utf-8');build(source)
