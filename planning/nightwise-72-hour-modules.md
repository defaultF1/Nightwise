# NightWise: Android delivery in 48–72 hours

> Latest 10 September update: PDF offline completion is recorded in planning/nightwise-current-status.md. Black is the default; intro Skip is removed. Version 0.6.3 adds ranking, staffing proxies, help gaps and map labels. Google calls remain paused. The previous APK passed 21 phone checks; Back and native GPS checks remain. GitHub pushes and hosting are explicitly deferred. Older statements below are historical.


Scope locked from the latest user instructions. Android is required; iOS is optional after Android is ready. At most ten tutorial users. Full Bengaluru map, with the latest demonstration from AEOS at 13.0628268, 77.5940888 to Manyata Tech Park at the supplied 13.047697, 77.619939 pin. This supersedes the older two-origin demonstration. Driving remains the provisional mode. The user now permits app construction before API keys/billing are supplied.

The canonical project folder is `D:/Aevy TV ( Achina Mayya )/Nightwise`. The earlier C: preparation workspace is retained as a backup, not the active implementation location. Forty-two preparation files were copied with matching SHA-256 hashes; the original roadmap and the user's launch reference were also copied here.

## Delivery definition

The target is an installable Android tutorial build with a working journey flow, route selection, explainable activity display, uncertainty/recovery states and Google Maps handoff. Before provider access, a clearly labelled sample-data mode makes the whole flow testable. A connected live build requires restricted Google credentials, backend hosting, provider-use decisions and local handoff checks; it cannot be honestly called live-complete without those.

Keep iOS, public store publication, login, community reporting, SOS, background tracking and in-app navigation outside the deadline's critical path. The architecture continues to support iOS later. A launch video is polish, never a reason to delay app startup or the APK.

## Modules and completion evidence

| Module | Roadmap responsibility | Work | Ready when | Needs keys? |
| --- | --- | --- | --- | --- |
| M0 — Workspace and build foundation | Project setup | Local source, dependency lock, Android toolchain, environment templates and shared contracts | Build scripts run and Android project can compile | No |
| M1 — App shell and launch | UI / UX | NightWise design system, navigation, launch motion with static fallback, accessible controls and native safe areas | App starts quickly, location is optional and sample mode is obvious | No |
| M2 — Journey and routes | Maps / route generation | Origin/destination, AEOS preset, mode, alternatives, synchronized selection, map adapter | Both demo journeys and zero/one/multiple-route states work | Fixtures now; real map/routes later |
| M3 — Activity and comparison | Sampling / score / explanation | Geometry sampling, deduplication, hours states, gap distance, shared score components, uncertainty, detour comparison | Meaningful synthetic tests pass; unavailable data never becomes zero activity | No for implementation/tests |
| M4 — Provider and budget integration | Backend / APIs | Restricted server requests, bounds, timeouts, cancellation, spend cutoff, real route/Places adapters | Live responses validated; measured cost/latency and permitted-use approach recorded | Yes — request access at this point |
| M5 — Android behavior and handoff | Navigation / delivery | Permissions, Android Back, resume, native map layering, external Maps preview and package signing | APK installs and core flow/handoff is checked on the intended phone | Native map key for live validation |
| M6 — Tutorial rehearsal | Validation / demo | Two real journeys, ten-user checklist, fallback, screen recording sequence and team notes | No fabricated live data; known issues and actual device results documented | Live access for live claims |
| M7 — Final package | Handoff | APK, source, local run instructions, configuration checklist and research/design pack | Package is reproducible and all included build limitations are explicit | No additional account for private APK |
| Optional — iOS | Later platform | iOS package, Xcode signing and TestFlight | Only attempted after Android acceptance and with Mac/Apple access | Apple account and build access |

## Order and deadline checkpoints

### Traceability to the original PDF's twelve modules

The sprint groups related work without dropping the roadmap's modules (PDF pages 6–8):

| Original module | Planned implementation boundary | Sprint group |
| --- | --- | --- |
| 1. Frontend app | App screens, reusable controls and native map view | M1/M2 |
| 2. Backend API | Hosted request validation, orchestration and configuration | M4 |
| 3. Route fetcher | Google Routes adapter behind a provider interface | M2/M4 |
| 4. Route sampler | Pure geometry and along-route sampling | M3 |
| 5. Places scanner | Bounded, time-limited Google Places adapter | M4 |
| 6. Place deduplicator | Unique place IDs per route, retaining sample associations | M3 |
| 7. Activity analyzer | Open/closed/unknown hours and potential help evidence | M3 |
| 8. Low-activity stretch detector | Contiguous along-route distance, unknown sections separate | M3 |
| 9. Road-type analyzer | Optional trustworthy road evidence; never infer main roads from names | M3/M4 |
| 10. Scoring engine | Versioned comparable components and uncertainty rules | M3 |
| 11. Explanation generator | Deterministic factual text from available evidence | M3 |
| 12. Google Maps handoff | Selected-route preview URL and native external launch | M5 |

Complete modules in order, with an early Android compile in M0/M1 so packaging risk is not left until the end. The suggested elapsed-time checkpoints are targets, not measured throughput or a guarantee:

| Window from implementation start | Target |
| --- | --- |
| 0–6 hours | M0 plus app shell; first Android compilation attempt; launch generation submitted |
| 6–18 hours | M1/M2: usable end-to-end sample journey and route selection |
| 18–30 hours | M3 and M4 preparation: tested comparison rules and provider adapters; request credentials when ready to make live calls |
| 30–42 hours | M4/M5: connect services if ready, device checks, fix handoff/map/permission issues |
| 42–48 hours | Candidate APK and tutorial package; explicit live-versus-demo status |
| 48–72 hours | Fixes, local rehearsal and final delivery buffer; iOS only if Android is already accepted |

The earlier 50–80 focused-hour estimate was for both platforms. This is a reduced-scope Android sprint under a 48–72-hour calendar constraint, not a claim that all former work fits automatically. Preserve core data correctness and recovery behavior; defer optional visual refinement and iOS first.

## When user help becomes necessary

Do not request API keys while building screens, sample fixtures or pure analysis. At M4, request a Google Cloud billing project and restricted Android/server credentials plus a small experiment budget. Set those through environment/secret settings, not chat. Connect to a hosted HTTPS backend before live use from team phones. Reserve at least the final 12 hours for live checks; late access reduces the time available to validate live behavior.

At M5/M6, obtain the actual Android phone and confirm the Manyata gate, Sahakar Nagar landmark, AEOS entrance and travel mode. The shared AEOS place coordinate is known, but its road entrance is not established. No key is needed to construct a standard Google Maps destination URL, but the selected corridor still needs device verification.

The prepared provider-support draft remains unsent. Until permitted scoring use is resolved, the live adapter may show ordinary routes and data limitations without publishing a proprietary activity rank. Do not quietly claim that connecting a key settles licensing or factual coverage.

## Launch animation

Using the supplied launch reference, Higgsfield Seedance 2.5 completed the navy ambient background. Estimated generation charge was 26 existing credits. Job: `2f83f793-965c-4e2b-8d25-342af4dabb1f`. The local clip measures 4.04 seconds at 720 × 1280 and an actual frame was inspected. Module 1 bundles it with crisp NightWise UI overlays, muted inline playback, a Skip control, dismissal when the clip ends, blocked-autoplay recovery, Settings replay, media-error fallback and reduced-motion bypass. It opens without waiting for a network stream. Native Android branding also uses the crescent and navy background.

## Current status

9 September implementation update: the user authorized work on M4 and M5. Provider/backend and Android code is now under verification. See the newer current-status file and module checkpoint reports for acceptance status. M4 is not live-complete without billing, the server credential and measured real-provider tests. M5 is not accepted without the intended-phone checks. The historical milestone below records M0–M3.

M0 through M3 are complete within the sample-data scope. The final M3 suite passed 34 unit tests and 14 browser tests. The updated Android debug APK compiled and its signature, package version and bundled assets were verified. M2 and M3 Word handoffs were rendered and visually reviewed. See [current status](nightwise-current-status.md) and [talks](../talks/README.md) for evidence and recovery instructions.

M4 provider integration is next. Real Bengaluru map rendering, live routing/places, calibrated evidence, permitted scoring use, intended-phone behavior and local rehearsal remain unverified. No API keys or billing have been used for Maps services. The full reel tutorial requires M4–M7; iOS remains optional after Android acceptance.

This is the current delivery plan and supersedes the platform/deadline assumptions in the earlier research PDF. The PDF remains useful research history; use this file for current sprint scope.
