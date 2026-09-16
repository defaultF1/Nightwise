# Night Activity Score v8: weighted listings

Version `night-activity-v8-weighted-listings` replaces v7 locally. The seven component allocations, walking weights, camera formula, fixed 100-point maximum and recommendation gates remain unchanged. This is a product-defined activity comparison, not a measured probability of safety.

## Problem and change

V7 applied a typical-hours discount after the density curve. Even arbitrarily many assumed-open listings therefore could not earn more than 35% of the density allocation. For spread, average reliability also kept an interval below the weak-activity threshold even when many estimated shops were present. This could penalise the same uncertainty both through interval support and a route-length gap.

V8 discounts each listing before aggregation: a supplied opening counts as 1, a typical-hours estimated opening as 0.35, and a closed, closing-soon, conflicted or unsupported listing as 0. IDs are deduplicated. The underlying hours and confirmed-open counts are unchanged.

- Density: add the weighted listings, divide by route kilometres (minimum 0.5 km), then apply `d / (d + 8)` and scan coverage.
- Estimated spread: each sampled interval receives `min(1, sum of nearby listing credits / 2)`. Length-weighted support and the existing weak-stretch adjustment then apply. Several estimated places can support an interval; a cluster cannot fill the rest of the route.
- Help and transport: retain the supplied-opening requirement. No automatic hospital hours or extra camera points have been introduced.
- Road evidence: positive matched main-road distance can supply a conservative lower bound. Zero main-road distance is not accepted from a mostly unmatched road extract. The UI describes identified distance as "at least", not a complete road classification.

Shared factors still have fixed allocations; absent factors never cause the remaining factors to expand to 100. No neutral starting points, cosmetic uplift or safety percentage is added. A factor absent from one route remains outside the shared comparison. Dense estimated activity can fill its spread allocation but cannot produce a perfect overall score from one factor.

## User-facing meaning

The ring caption says "Activity points · not a safety rating". The breakdown explains that more points mean more supported activity, and a lower score does not mean a road is unsafe. No new missing-data badges are shown. Estimated comparisons retain neutral alternative labels and do not automatically recommend a safer route.

These numerical assumptions remain uncalibrated in the field. Listing density and camera locations cannot establish crime reduction or actual personal safety. More data or a different departure time can change the result.

## Same-data comparison

Recomputed the saved AEOS–Manyata driving response checked on 16 September 2026 at 10:36:09 UTC. No new provider calls were made:

| Route | v7 | v8 |
| --- | ---: | ---: |
| Fastest | 29.1 | 35.7 |
| Alternative 1 | 37.2 | 43.7 |
| Alternative 2 | 35.7 | 42.2 |

These are development comparisons of a saved response, not freshly observed road conditions. No hosting, GitHub or APK publication is part of this change.
