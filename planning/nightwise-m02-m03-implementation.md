# M2 and M3 implementation contract

Authorized 9 September 2026: finish reusable visual assets first, then M2 and M3. Keep the working preview at http://127.0.0.1:4173. Blue is default and monochrome options persist. Live Google integration stays in M4.

## Assets first

Retain the completed Higgsfield launch video, crescent/vector icon system and six boards covering 24 states. Add no-route, connection-retry, incomplete-evidence and activity-explanation illustrations via Higgsfield GPT Image 2.5. Inspect before integration. Use real DOM text, controls and SVG route graphics; raster illustrations are decorative and contain no geographic evidence. An extracted launch frame supplies a local poster. Prompts and job IDs belong in assets/illustrations/generation-record.json.

## M2 journey and routes

Two explicit tutorial origins and the supplied AEOS destination; destination details state that the entrance is unverified. Driving is the supported provisional mode. Use a typed abortable route-provider interface, validated result boundaries, bounded alternatives and immutable journey snapshots. Compare cancels previous work; edit/cancel invalidates stale responses. Preserve inputs through recovery and returning from the handoff sheet.

Use synthetic polylines in a clearly labelled selectable route diagram, not a fabricated Bengaluru basemap. The map-view interface receives routes, selection and callbacks so a real Google adapter can replace it in M4. Shared endpoints and geometry are illustrative. Card selection, diagram selection, details and handoff preview reference one route ID. Handle zero, one, two and three options plus recoverable errors.

## M3 evidence analysis

Pure analysis from independently authored observations, not precomputed UI numbers. Sample polylines initially every 200 metres, include endpoints and the final partial segment, bound sample counts, and reuse exactly equal sample coordinates within a comparison. Deduplicate place IDs per route while retaining every sample association. Unknown, failed, truncated and stale evidence must not silently become a complete zero.

Evaluate weekly opening periods in an explicit IANA time zone with overnight/week-wrap and soon-closing cases. Use one comparison timestamp. Distinguish current opening evidence from availability on arrival and potential help categories from verified access.

Measure scan coverage by along-route distance. Mark each segment active, low-observed-activity or unknown. Unknown segments split gaps. Low-activity means no confirmed open listing at the sampled endpoints under usable evidence; it does not mean an empty or unsafe street. Preserve observed maxima separately when overall gaps are unavailable.

Use a versioned experimental model with the roadmap weights: open density 25, reliable road fraction 20, help density 15, gap continuity 15, maneuver simplicity 15 and time-relevant transport activity 10. The common available component set and denominator must be identical across candidates. Missing common core evidence suppresses the comparison. Keep uncalibrated numeric scores internal; UI explains supported differences. Do not automatically favor a longer route for counts alone. Expose tie, excessive-detour and insufficient-data outcomes. No live provider ranking is enabled by this work.

## Verification and handoffs

Unit tests cover geometry, repeated coordinates/loops, endpoint retention, deduplication, query reuse, missing/stale/capped scans, timezone hours, distance-weighted coverage, unknown-separated gaps, common scoring denominators, length normalization, ties and detours. Browser checks cover both origins, zero/one/multiple routes, synchronized selection, details, cancellation, retries, input preservation, mono themes and narrow layouts. Save actual screenshots and separate Word reports for M2 and M3 with errors, fixes and limitations. Run a web production build; Android packaging/device acceptance remains a separate explicit check.
