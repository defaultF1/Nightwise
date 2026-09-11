# NightWise project instructions

These instructions record the user's ongoing project preferences. Later explicit user instructions take precedence.

Latest scope update, 10 September: the user authorizes the seven journey enhancements (flexible endpoints and swap, endpoint confirmation, evidence confidence, help points, extra-time preference, saved places, freshness), smooth transitions and immersive Android fullscreen. Publish finalized source to https://github.com/defaultF1/Nightwise, preserving its existing license/history. This supersedes the earlier GitHub deferral and feature deferrals below. HTTPS service deployment still needs a destination; GitHub source hosting is not backend hosting. Community submissions/voting remain excluded. Use Bengaluru Palace rather than GrowthSchool for an example search; no unverified preset coordinates should be invented.

Latest live scope expansion, 10 September: also support Kanpur current-location journeys and searched destinations in the requested north/west neighbourhoods. Keep Bengaluru presets and tutorial unchanged. Show approximate GPS address when available and real driving estimates in live typeahead. Details cap 100 is authorized and active; route/nearby caps remain 30/1500. Read current status before using paid calls.

## Resume and recover context

Work in D:/Aevy TV ( Achina Mayya )/Nightwise. Before resuming after context loss, read planning/nightwise-current-status.md, planning/nightwise-72-hour-modules.md, talks/README.md and the newest module handoff in talks. Consult research/nightwise-bengaluru-research.md and linked source material for evidence or provider constraints. Check the actual files and current test/build results before treating old notes as current truth.

## Module handoffs

After completing each module, create a dated Word document in talks. Include the module identifier and name, scope and completion status, what changed, the approach and reasons, important decisions, errors encountered and their known causes, fixes and unresolved issues, verification results, useful screenshots with captions, affected file paths, next steps and any help required from the user. Say when a cause is only suspected. Distinguish generated concepts from actual app screenshots and sample data from live evidence. Never include credentials, tokens or billing secrets.

Use names such as YYYY-MM-DD_M01_app-shell_v01.docx. Preserve previous reports; add a revision if later work changes the record. Keep a matching Markdown source and update talks/README.md plus planning/nightwise-current-status.md so context can be recovered without parsing every Word document. A checkpoint for partial work must say it is incomplete; do not call an unfinished module complete.

The local report authoring helper is scripts/write-module-report.py; its inputs are in talks/records. The Windows runtime has no bundled LibreOffice. scripts/render-module-report.ps1 uses the project-private official renderer extracted under .tools/report-renderer-portable, plus bundled Python and Poppler, for the packaged DOCX render workflow. Inspect all rendered pages. Do not repeat the stalled Word COM export or Windows Installer administrative-image attempt without new evidence; the direct archive extractor is scripts/extract-report-renderer.py.

## Accepted scope and design

Android first for a maximum of ten tutorial users, within the user's 48 to 72 hour delivery constraint. iOS is optional after Android. Use the full Bengaluru map, with the current demonstration from AEOS (13.0628268, 77.5940888) to the supplied Manyata Tech Park pin (13.047697, 77.619939). This latest user instruction supersedes the earlier Manyata/Sahakar-to-AEOS presets. Public gates and road approaches still need a local check. Driving is provisional.

The latest appearance decision is black (Mono Dark) by default, with optional Mono Light and original Blue. Remember the chosen appearance through relaunch. There is no Skip button on the intro. On 10 September the user resumed Word reports and status notes, prioritized PDF gaps, deferred the seven proposed enhancements, and explicitly deferred GitHub pushes and hosting.

Use the prepared module plan. API keys and billing can be requested when live integration actually needs them; build credential-free components first. Do not call sample data live or imply activity ratings guarantee safety. Local source, research, designs and handoffs belong in this project folder.

## Configuration confidentiality

Keep credentials out of reports, screenshots, logs, recovery notes and source exports. Private environment files and .local configuration are not source deliverables. Client map keys necessarily enter their browser/Android builds; the server key must never enter a VITE variable or client bundle. Record configuration status without values.
