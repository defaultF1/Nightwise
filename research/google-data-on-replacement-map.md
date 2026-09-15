# Feature parity and Google data on the replacement map

Checked 15 September 2026. User requirement: preserve all Nightwise functionality while changing the map. The Geoapify preview does not yet meet this requirement; it changed routing/place providers as well as the renderer. Missing activity scoring is an unresolved gap, not an accepted removal.

## Why the score is missing

The saved actual AEOS–Manyata comparison has roughly 5–8% hours coverage. `compareActivity` explicitly withholds Geoapify scores when any route has less than 50% hours coverage or 80% scan coverage. These are app thresholds, not Google requirements. The old Night Activity Score is Nightwise's calculation, not a safety measurement delivered by Google. Default category hours and saved map pins do not establish current opening hours.

## Can we reuse the existing Google shop calls?

The standard non-EEA service terms, section 14.2, prohibit using Places API content in conjunction with a non-Google map. That covers the straightforward proposal to reuse the old Nearby/Details pipeline for the replacement map. The API key does not change the service terms. Billing-address jurisdiction or a separate negotiated license could matter; neither was newly verified here.

There is a specific alternative: section 15.1 allows **Places UI Kit** with non-Google maps. Google's documentation describes components displaying search results and individual details, including opening hours. This deserves evaluation for the app's search and place-details functions. It is not evidence that ordinary Places API responses can be extracted into our custom pins, cache and score engine under the UI Kit exception. Section 15.4 preserves the supplied attribution, links and notices. The reviewed JavaScript overview marks the product experimental.

**Places Aggregate API** has permissions for suitably transformed custom metrics (section 13), but its documented filters cover operational business status, not opening at the user's passing time. Operational means the business has not permanently/temporarily closed; it does not establish that its doors are open tonight. It therefore is not a replacement for opening-hours-based scoring.

## Implementation decisions still to resolve

1. Keep MapLibre route interaction, themes, full screen, GPS, pin colours and external navigation working locally.
2. Evaluate a small Places UI Kit place-details/search proof against AEOS–Manyata, confirming permitted returned fields, source attribution, component/API enablement and measured request cost before broader use. No Google calls or account changes were made for this research.
3. For our custom passing-time calculation, obtain independently licensed schedules or an explicit provider permission covering the intended combination. Compare coverage on all shown routes. Preserve uncertain schedules as uncertain.
4. If Google's exact routing/Places pipeline is required immediately, the preserved Google-map mode remains the established configuration; moving standard Google results to MapLibre is not a supported drop-in conversion under the reviewed terms.
5. Do not claim feature parity until search, GPS, modes/ETAs, route selection, coloured pins, opening-hour evaluation, score explanations and handoff all pass the same acceptance checks.

## Primary references

- [Current service-specific terms, sections 13–15](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Places UI Kit overview](https://developers.google.com/maps/documentation/javascript/places-ui-kit/overview)
- [Places Aggregate request parameters](https://developers.google.com/maps/documentation/places-aggregate/request-parameters)

The local tap-target fix is independent of these data decisions: route lines now accept taps within 22 CSS pixels and choose the nearest rendered route. Business pins retain their popup interaction.

## Subsequent user-requested estimate mode

The user subsequently requested restoring the visual score using their previously selected category schedules. Geoapify now explicitly opts into a separate estimated comparison when hours coverage is sparse. It retains the same circular component and weights; available road information and opening-density estimates contribute. Unverified help availability, activity continuity and transport do not contribute. The UI says "Estimated Night Activity Score" and the breakdown explains the shop/pharmacy/fuel schedules. Known closures override estimates; hospitals receive no default hours. Failed scans or missing listings do not acquire estimated activity scores. Original observations and confirmed-open counts are unchanged. The fastest route remains selected; an estimate is not presented as a safety recommendation.

Summary counts now omit the "unknown" suffix but retain those places in the "found" total. Individual records keep their hour status, date and source. The original Google mode's scoring behaviour is unchanged.

Validation: 25 targeted unit tests passed, TypeScript and the Geoapify production build passed (existing large-bundle warning), and the route-tap browser regression passed. Browser checks using the saved actual Geoapify response passed in dark, light (320 px) and blue themes: three labelled rings, no horizontal overflow, no "unknown" in the map summary counts, and the estimate explanation in details. These tests used saved/mocked responses and made no new Google requests. Scores in that saved comparison were 92, 90 and 77 in ranked order, using 3 of 6 signals; they are planning estimates, not verified live safety scores.

The older project's place-name list was inspected: `src/data/corridor-places.ts` explicitly describes tutorial labels and sample opening states, so those states were not imported as business hours. The earlier operator-hours research and today's source-linked directory remain available. A complete, current, individually verified set of all shop and hospital hours has not been established, and no Google shop records were copied into the replacement dataset in this change.
