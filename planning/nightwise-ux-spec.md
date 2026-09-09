# NightWise UX specification

Planning draft, updated 9 September 2026. Target Android and iOS through a shared Capacitor interface. Use Bengaluru, India, with north Bengaluru demo journeys to the user-supplied AEOS pin. Six concept boards cover 24 principal states. Place labels reflect the brief, but generated map imagery, times, distances and counts are illustrative. See `nightwise-ui-state-index.md` for mappings and variants.

## Product hierarchy

Help the user answer three questions: what route choices are available, what observed activity changes with extra time, and how to continue with their choice. Keep the interface focused on one journey. Make evidence and uncertainty legible without turning the page into an analytics dashboard.

Preserve the roadmap's map-above-cards hierarchy and recommendation-first ordering when a recommendation is justified. Use NightWise as the working name. The roadmap diagram's SafetyFirst label is not the selected name.

## Visual direction

The user approved the original midnight-navy and blue interface with teal accents on 9 September 2026. Use this as the initial default. Add Mono Light and Mono Dark appearance options and remember the selection locally. All themes use the same components, content and behavior. Pair color with labels, borders and line styles so monochrome themes preserve selection and uncertainty cues. Avoid a red/green danger-versus-safe system and shield imagery that implies protection.

Use generous spacing, readable route times, restrained rounded surfaces, and a clear primary button. On Android/iOS, keep a compact journey summary, modest native map and stacked cards with a bottom action respecting system insets. The optional desktop browser preview shows cards beside a larger map. Native platform status bars and OS permission dialogs are not custom app UI.

The mockup is a raster design reference, not a working screen or an asset to render as the app interface. Production text, buttons, maps, and accessibility semantics must be implemented as real UI later. Use a real Google map of Bengaluru with required attribution. The new concepts label their map areas as placeholders; decorative geometry is not suitable for navigation. Map access across Bengaluru does not imply validated activity coverage across the city.

## Screen and state inventory

| State | Content and behavior |
| --- | --- |
| Entry | Origin field, 'Use my location', destination autocomplete, clear mode, 'Compare night routes'. No automatic location prompt on page load. |
| Location granted | Show a readable origin with an edit option. Do not display unnecessary coordinate precision. |
| Location denied or unavailable | Preserve the journey form and offer manual origin search. |
| Comparing | Report actual stages, such as finding routes and checking nearby activity. Allow cancellation; avoid fabricated percentages. |
| Results | Map, recommendation if supported, fastest comparison, durations, distance, time difference, score/confidence when valid, and a short factual reason. |
| Selected route | Selected map line and card stay synchronized. Button clearly refers to the selection. |
| Details | Up to five evidence rows: observed open places, potential help points, estimated longest low-activity section, data completeness, and evidence time. Unsupported road claims remain absent. |
| One route | 'Only one route was returned.' Show available evidence without a comparative recommendation. |
| Similar evidence | 'These routes have similar observed activity.' Preserve the fastest option. |
| Limited data | 'Not enough information to recommend a route.' Unknown areas are visibly distinct from low-observed-activity sections. |
| Failed API or quota | Plain-language recovery action, preserved destination, retry only when appropriate. No fake score. |
| Long route over analysis budget | Explain that the journey cannot be fully assessed; offer a shorter journey rather than silently skipping sections. |
| Daytime request | Explain that current opening-hours evidence describes now. Do not claim it forecasts tonight. |
| Handoff | 'Open in Google Maps'; nearby copy: 'Google Maps may update the route. Check the preview before starting.' |

## Route card anatomy

1. Route label and a justified 'More active route' or 'Fastest' badge.
2. Duration and distance; the extra minutes appear next to the alternative duration.
3. 'Night Activity Score' only when supported, with an estimated/data-quality qualifier. The new reel concepts lead with observed evidence and omit the number until the scoring/data-use decision is resolved; the score remains a conditional roadmap requirement.
4. One or two lines explaining the strongest measured differences.
5. Expandable evidence and visible selected state.

Example copy, using synthetic facts: 'For 4 extra minutes, this route has more places listed as open and a shorter low-activity stretch.' Each phrase must be supported by the response. Do not insert 'mostly main roads' unless the road-type evidence is reliable.

Keep observed open places, potential help places, and closed/unknown establishments distinct. A nearby hospital is a place category, not a guarantee that the user can access it from the route. Show longest gaps as approximate distances, consistent with sampling resolution.

## Essential interaction rules

- Explicitly ask for location only after the user taps the location action; manual origin remains available.
- Starting a new comparison invalidates old analysis. Ignore stale responses so the wrong destination cannot overwrite the current result.
- Preserve user input after recoverable errors and when returning from Google Maps.
- Keep the fastest route selectable even when another route ranks first.
- Show incomplete evidence before the user opens navigation, not only in an expandable footnote.
- No sign-in, SOS button, sharing, reports, tracking, or account navigation in v1.
- Do not continuously poll or track the user's location. Re-analysis is deliberate.
- Use native one-time location access after a tap; support approximate location and manual correction, permission denial and location services off. No background location behavior.
- Android Back dismisses a sheet/keyboard before leaving the flow. iOS safe areas, system gestures and app resume must preserve a coherent journey. Returning from Google Maps must not trigger a silent scan.
- Test map touch handling, native view layering and attribution on both operating systems. Offline launch shows the connection state; it cannot produce live activity estimates.
- Use autocomplete selection as the default address resolution path; do not silently interpret ambiguous text.

## Accessibility and responsive review

Target visible keyboard focus, form labels, meaningful screen-reader names, sufficient text contrast, touch targets around 44 px, and no color-only distinctions. These are design targets to verify in implementation, not claims about the mockup. Check narrow phone screens, large text, long place names, device safe areas, keyboard opening, and screen zoom. The map must not be the only way to choose or understand a route.

Keep the source attribution unobscured by bottom sheets or floating controls. Separate app-generated explanations from provider information. Add concise product copy explaining that activity is estimated from available listings and is not a safety guarantee; fuller privacy and terms content can live on secondary pages.

## Design review criteria

The direction is ready for implementation once the user can identify the time tradeoff within a few seconds, select either route easily, understand missing data, and see that navigation continues in Google Maps. The written specification is authoritative if a generated image contains text or layout inconsistencies.
