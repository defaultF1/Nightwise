# Night Activity Score v6: supported activity points

The v5 score saturated shop density at eight places/km and expanded whatever signals remained to 100. Walking excluded road signals, and sparse-hours estimates removed most remaining factors. One shop-density factor could therefore produce 100/100 on several unrelated routes.

Version `night-activity-v6-supported` uses fixed contributions. Missing signals remain absent internally and do not expand the other allocations. A low supported score is not a declaration that the route is unsafe. This is an original, deterministic product formula for activity evidence, not an empirically calibrated personal-safety prediction.

## Allocations (total 100 in each mode)

| Factor | Car / motorbike | Walking |
| --- | ---: | ---: |
| Open-place density | 25 | 30 |
| Mapped main-road share | 20 | 0 |
| Open help / staffed-place category evidence | 15 | 25 |
| Activity spread / continuity | 15 | 30 |
| Fewer turns | 15 | 5 |
| Open transport listings | 10 | 10 |

Walking receives no main-road bonus and no extra penalty for internal-road turns. Its own route's supplied maneuver count can still contribute to simplicity. Absent turn counts do not become zero turns.

## Calculation

1. Distance denominator is at least 0.5 km to prevent one place on a tiny route dominating the index.
2. Density uses `d / (d + h)`, where `d` is count per kilometre. The half-credit point `h` is 8 for general places and 1 for help or transport. This grows gradually: 8 open places/km gives 50% of the density allocation, 16 gives 67%, and 40 gives 83%.
3. Supplied opening schedules receive full opening credit. Typical-hours defaults receive 35% credit and never count as verified open help or transport. Closed, conflicting and closing-soon places receive no opening credit. Original observation states are not rewritten.
4. Estimated density is `density(total supported-open count/km) * average opening credit * scan coverage`. Consequently even arbitrarily many assumed-open places cannot fill the density allocation.
5. For estimated spread, evaluate each actual sampled interval using distinct nearby place IDs. Local support is `min(1, contributing places / 2) * average opening credit`. Average by interval length and apply `1 - 0.5 * min(1, longest weakly-supported run / 1500m)`, then scan coverage. Under 0.5 support counts as a weak interval for this internal calculation. Unchecked sections never earn positive support; they are not labelled closed or dangerous.
6. Supplied-schedule continuity retains the observed gap formula, multiplied by assessed activity coverage and scan coverage. No open places cannot earn a continuity bonus merely because no low gap was measured.
7. Help combines 75% help density and 25% staffed-category density, with an observed help-gap factor and scan coverage. These are category/schedule proxies, not measured staffing or emergency response times. Transport uses its own density and scan coverage.
8. Main-road and simplicity components retain their existing mapped-road/turn formulas. The final score is the sum of fixed weighted contributions for factors shared across the compared routes. It is never divided by the sum of the available weights. Adding a route with fewer comparable factors can reduce that shared basis; scores should only be compared within the same journey, mode and evidence check.

Constants (35%, density half-points, 1500m, 500m floor and allocations) are explicit product assumptions. Regression tests check mathematical behaviour; field evaluation around AEOS-Manyata should calibrate them before any claim of predictive accuracy.

## Recommendations, cameras and UI

Estimated comparisons keep the fastest selection and neutral alternative labels. A supplied-schedule comparison needs at least 60 allocated points of shared factors and the existing advantage/detour checks before recommending. Camera counts remain outside the numerical activity formula. The legacy Safest label uses a deterministic top-score band of three points before its camera tie-break, and is suppressed for estimated/insufficient comparisons. This label does not measure crime risk.

The score card shows the number and “Route activity estimate”, without missing/unknown badges or an “X of 6” count. Details show only evaluated factors, their actual fixed point limits and the method. No placeholder points are added for hidden fields. There is no number when scoring has no usable shared evidence.

Frontend and backend call the same versioned formula with the selected travel mode. The provider setup remains Geoapify/OpenStreetMap and MapLibre. No added paid data requests or camera API are required.

## Verification cases

Regression coverage includes the one-signal walking failure; continued differentiation above eight shops/km; assumed-hours ceilings; equally numerous clustered versus distributed places; known closure and closing-soon exclusions; duplicate place identity; unknown hospital hours; scan coverage; main-road neutrality for walking; zero/invalid/short lengths; fixed component contributions; deterministic labels; and the existing detour and same-evidence-time rules.

Local verification on 16 September 2026: all 246 unit/backend tests passed; the hosted TypeScript/client/server build passed; seven focused browser cases passed across navigation, three dropdown themes, partial score details, road evidence and walking scores. Score screenshots were inspected. Android Java compilation passed. Provider calls in browser checks were mocked; installed navigation-app behavior and field calibration remain phone/real-world checks. No deployment or APK release was made for this change.
