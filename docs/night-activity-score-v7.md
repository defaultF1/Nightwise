# Night Activity Score v7: numerical camera evidence

Historical version. The local development formula is now [v8](night-activity-score-v8.md); the previously delivered 2.3.2 APK still contains v7.

Version `night-activity-v7-cameras` replaces v6. The user requested a numerical camera contribution. This is a product-defined comparison of activity, roads and mapped camera evidence; weights are not calibrated crime probabilities.

| Factor | Car / motorbike | Walking |
| --- | ---: | ---: |
| Open-place density | 25 | 25 |
| Main-road share | 15 | 0 |
| Open help / staffed-place categories | 15 | 25 |
| Activity continuity | 15 | 25 |
| Fewer turns | 10 | 5 |
| Open transport listings | 10 | 10 |
| Mapped camera evidence | 10 | 10 |
| Total | 100 | 100 |

The existing gradual place-density formula, 500 m minimum distance denominator, 35% opening credit for typical-hours estimates, scan coverage adjustment and fixed shared factor allocations remain. One factor is never rescaled to 100. Supplied opening schedules take priority; typical-hours assumptions do not confirm open help points or transport operation. Details omit absent factors and missing-data badges.

## Camera calculation

The bundled OpenStreetMap extract has source timestamp 2026-09-15T23:03:27Z and was retrieved on 16 September. Its query covers a 20 km circle around 13.0553,77.6070. Entire route geometry and its 60 m buffer must fit inside this study area to receive this component. Outside that area the camera component is absent, not a claim that no cameras exist. Only live Geoapify provider geometry receives bundled camera evidence; tutorial and Google-checkpoint routes are not mixed with these records.

1. Select mapped records within 60 m of the actual route polyline. Exclude zones containing private or indoor. Untagged records remain mapped-location evidence; no assumption of working cameras is made.
2. Deduplicate IDs and count records within 10 m of each other as one site, in stable ID order.
3. Let `d = eligible sites / max(route kilometres, 0.5)`. Density support is `d / (d + 2)`: two sites/km earns half the density portion.
4. Split the actual path into equal sections no longer than 500 m. Project each site onto its nearest route segment. Spread is the fraction of sections with at least one eligible site. Repeated roads do not duplicate a camera site.
5. Camera points = `10 × (0.6 × density support + 0.4 × spread)`. No mapped eligible sites gives zero camera points; many cameras at one place cannot represent distribution along the whole route.

This measures mapped-site proximity and distribution, not field of view, actual surveillance coverage, recording, police monitoring or crime reduction. The 10-point allocation, two-sites/km half-point, 60 m filter, 10 m site grouping and 500 m sections are explicit product assumptions. Field calibration remains required.

Both backend and frontend use the same camera evidence builder and score version. The numerical total determines ranking. The old separate camera tie-break is removed so cameras are not rewarded twice. Estimated/insufficient comparisons keep neutral alternative labels and the fastest selection. The current map may show additional private/indoor records that do not earn points; the breakdown reports eligible site count separately.

No additional API calls or Render/Upstash environment variables are required. The camera source is a bundled snapshot and does not become fresh when shops are refreshed. Source-code deployment updates the backend formula; the Android bundle recomputes comparisons with its bundled v7 formula.

## Verification on 16 September 2026

All 251 unit/backend cases passed after correcting the camera geometry fixture; seven focused browser cases passed, including camera points in walking details, partial evidence, road evidence, three dropdown themes and navigation URLs. The TypeScript and hosted client/server build passed. Recomputing the saved AEOS–Manyata response from 10:36:09 UTC found 5, 13 and 7 eligible sites, contributing approximately 2.9, 5.6 and 3.5 camera points. This recomputation used the existing snapshot and made no new provider requests. Physical navigation-app handoff and real-world camera verification remain device/field checks.
