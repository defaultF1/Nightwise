# NightWise readiness and owner inputs

Current delivery update: Android required within 48–72 hours, iOS optional, implementation authorized with credentials deferred. See `nightwise-72-hour-modules.md`; older estimates below are research history. Canonical folder: D:/Aevy TV ( Achina Mayya )/Nightwise.
Planning only. No account setup, API activation, credentials, messages, or deployment has been performed.

## Preparation status

| Item | Status |
| --- | --- |
| Full roadmap and embedded diagram review | Complete |
| Workspace inventory | Complete: empty initialized Git repository |
| Scope, inconsistencies, phased estimate | Written in project plan |
| Current Google documentation and price checks | Complete at documentation level |
| UI state and copy specification | Prepared |
| Visual concepts | Original reference plus current Bengaluru set: six boards covering 24 principal app states; sample data only |
| Validation and local pilot checklist | Prepared |
| City, geography, destination and audience | Confirmed: Bengaluru; Manyata/Sahakar Nagar to AEOS; at most ten participants |
| Target platforms | Confirmed: Android and iOS; proposed Capacitor shared UI, APK and TestFlight delivery |
| Native build access and signing | Unconfirmed: Android toolchain, Apple membership, Mac/build service and signing ownership |
| Mode, shoot date, target phone, origin gates and API budget | Awaiting user input; driving is provisional |
| Chennai and Bengaluru research | Primary reports retrieved, key pages visually checked; research document prepared |
| Actual API coverage, cost and latency | Not tested |
| Scoring permitted use and exact handoff behavior | Unresolved feasibility decisions |
| Application implementation | Not started, per user instruction |

## First user decisions

The remaining useful inputs are travel mode, shoot date, Android/iPhone models and OS versions, API budget, Google Cloud billing, Apple Developer membership and Mac/build-service access. Bengaluru, AEOS (13.0628268, 77.5940888), Android plus iOS, and at most ten total users are confirmed. Driving remains an assumption.

Select the public Manyata gate and Sahakar Nagar landmark; check the AEOS entrance locally. Review the Bengaluru UI boards and working name, NightWise. See the research document for the current 50–80-hour both-platform estimate. External account and Apple beta review lead time are additional.

## Future account setup checklist

Once implementation is authorized, use a user-owned Google Cloud project with billing. Confirm India pricing eligibility. Prepare Maps SDK for Android, Maps SDK for iOS, Routes API and Places API (New); enable Maps JavaScript API only for the browser preview. Autocomplete (New) is part of Places. Geocoding is optional. Do not enable Aggregate just because it is mentioned: select the data approach first.

Prepare separate restricted native Android and iOS map keys, an optional website-restricted preview key, and a server credential for backend services. Store server credentials in hosted secrets. Native keys remain visible inside app packages and depend on appropriate restrictions. Do not paste credentials into chat or commit server secrets. Use owner-controlled Android signing and Apple provisioning; never put the server runtime or secrets inside an APK/IPA.

For iOS, arrange macOS/Xcode access and Apple Developer membership, then prepare TestFlight information and review submission. For Android, arrange Android Studio/SDK and a signed APK. Install and rehearse on at least one real phone per platform. External TestFlight review time is not controlled by implementation hours. No enrollment, installation, build upload, tester invitation or app distribution has occurred.

Agree a small live-test call budget before testing, then configure quotas, request caps, and a cutoff. Set billing notifications as an additional signal. Select hosting with server execution, HTTPS, secrets and request-duration capacity. A public demo URL can precede a custom domain. If GitHub is desired, use the user's selected account/repository; no external repository has been created.

## Draft for Google Maps support or account representative

This is a draft for the account owner to review and send. It has not been sent by the assistant.

Subject: Permitted use clarification for NightWise route activity comparison

We are planning no-login Android and iOS apps with a shared Capacitor interface and hosted backend for a ten-person Bengaluru pilot. They will display Google Routes alternatives using native Google Maps SDKs and open the user's choice in Google Maps. An optional web preview would use Google Maps JavaScript. The product will not provide its own turn-by-turn navigation or claim personal safety.

The proposed analysis samples locations along each returned route, requests nearby place categories and available opening hours, deduplicates places within that comparison, and calculates a proprietary estimated activity score and low-observed-activity stretches. The app will explain the extra travel time versus observed activity, with clear missing-data limitations and provider attribution.

Please confirm whether this use is permitted under the restrictions on creating content from Maps content, spatial analysis, and modification of search results. In particular, can route alternatives be ranked using this computed score, and can transient per-route counts and gap estimates be displayed?

Please also confirm allowed transient processing, diagnostic retention, and caching for place identifiers, coordinates, opening hours, route geometry, and the resulting analysis. If Places Aggregate or another licensed Maps product is the appropriate route, please advise how a time-specific opening-hours signal can be used with that product and its customer-value terms.

We will not assume that this request grants permission, or retain provider records beyond applicable terms. We would appreciate a written response identifying the appropriate APIs, contract provisions, and limitations.

## Inputs needed later for publication

Identify the app owner/contact, hosting project, expected access level (private demo or public pilot), and privacy/terms contact details. Review public copy to ensure activity estimates cannot be mistaken for guaranteed safety. Deployment is a later milestone after the user authorizes implementation; the roadmap's setup instructions have not been executed.
