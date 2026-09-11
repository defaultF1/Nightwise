# Public evidence checkpoint — incomplete live acceptance

User requested evidence collection first. Collected 21 operator location records (14 clear regular schedules and coordinates, six ambiguous schedules, one coordinate conflict), 671 OSM opening-hours elements within 10 km of supplied AEOS, and an expanded OSM road extract of 58,613 highway-tagged ways/280,746 points. Saved exact Overpass queries, timestamps, hashes and ODbL attribution. No Google response content or credentials copied into the new package.

Only four OSM elements have explicit hours-check dates; 143 have indoor/floor tags. Eleven same-name nearby pairs require duplicate review. Counts are not proof of distinct open roadside shops or coverage. Aster coordinates disagree by 212 m. Actual routes, entrances, holiday exceptions and night-time conditions remain unverified.

Existing app evaluateHours function projected the 14 clear regular schedules at 21:00/22:30/23:30 IST on 10 September: 14/12/1 scheduled open respectively. This is not an observed-open assertion or live route score. No application source changes, APK build, deployment, scoring enablement, paid Google calls or field visits occurred during this collection.

Detailed report and structured records: [research evidence README](../research/evidence/2026-09-10/README.md). New road evidence is retained separately from the production extract.

Hosted authenticated comparison remains pending: the privately prepared ignored `.env.evidence` file has no team access code. The local stale ledger was not used to bypass the shared Redis counter. Browser automation failed to initialize twice; web search and direct public requests supplied evidence. No need for additional Google keys.

Next: authenticated bounded real-route comparison, route association and identity reconciliation, revised evidence measurements, then local night journeys. This partial research checkpoint does not complete a module and does not mark the PDF score/recommendation criteria green.
