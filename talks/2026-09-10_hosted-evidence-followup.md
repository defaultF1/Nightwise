# Hosted evidence follow-up — incomplete scoring acceptance

10 September 2026, 13:22 IST. Saved the supplied existing team code to ignored `.env.evidence`; no secret copied into reports, application source or the evidence package.

One authenticated hosted AEOS–Manyata comparison succeeded with HTTP 200 and three real Google routes. Known-hours coverage 63.5/69.3/60.2%; complete scans 50.0/51.7/73.8%; classified road distance 90.0/83.6/76.2%. No live scores returned. This is a daytime provider check, not night-time field validation.

Running the existing road classifier on research subsets from the expanded OSM extract produced identical coverage to the hosted road dataset. Increasing the map area alone does not resolve these routes' classification gaps. The full 34 MB/58,613-way file exceeds existing loader limits and was not substituted into production. Proximity review identified 1/2/1 operator candidates and 18/26/5 OSM hours candidates within 100 m of the real route paths. No identity, public entrance or street-access verification is implied; candidates were not merged or scored.

Hosted cumulative counters: 18 Routes, 753 nearby, 2 autocomplete, 2 details; caps 30/1500/40/20. No atomic before-counter was available, so the nearby delta for this comparison is not inferred from an older user-testing snapshot. One comparison sent, no automatic retry. No budget increase, code push, deployment, APK change or scoring enablement.

Records: [evidence report](../research/evidence/2026-09-10/README.md), [hosted aggregate](../research/evidence/2026-09-10/hosted-comparison.json), [candidate audit](../research/evidence/2026-09-10/hosted-route-evidence-audit.json). Google route/listing response held in memory and not saved as a reusable raw dataset. This supersedes the prior checkpoint's pending hosted-code statement. Remaining work: source reconciliation, scan completeness, road ambiguity, night-time journeys and scoring acceptance.
