# Mappls navigation handoff — 15 September 2026

The local Geoapify preview defaults to Mappls in the Start navigation dialog. The selector also retains the existing Google Maps option. This is an explicit two-provider selection, not a promise that every installed navigation app accepts one universal route URL.

The Google-specific sharing sentence was replaced with neutral wording about the selected navigation service. The privacy description follows the same wording.

Mappls directions use `https://mappls.com/direction?places=...` with the chosen origin, up to three ordered guide points for an alternative, and the destination. The fastest route has only its two endpoints. Stale/mismatched route geometry is excluded using the existing handoff checks. No Mappls API key is required to construct this link, and changing the selector does not make a routing request.

The Mappls direction-link documentation supports via points but does not specify a travel-mode parameter. The dialog tells the user to select the desired travel mode in Mappls. The separately documented `/navigation` link can set mode but documents a destination only; silently switching to that would lose a remotely selected origin and alternative-route guide points. Departure time also needs setting again in the receiving app. Receiving apps can recalculate between guide points; a matching full polyline is not guaranteed.

Android permits only the known HTTPS direction endpoints, explicitly tries package `com.mmi.maps` for Mappls or `com.google.android.apps.maps` for Google, then falls back to an unpinned URL intent if no activity handles the explicit package. The manifest declares both packages. Installed-app behaviour remains a device acceptance test; no new APK is packaged by this change.

Validation: six handoff unit tests passed, including fastest/direct links and ordered alternative points, and TypeScript passed. A browser check with the saved actual comparison confirmed Mappls as default, five points for the selected alternative, Google switching, neutral sharing text and no horizontal overflow. The dialog screenshot was visually checked. No live navigation or new paid route/Places calls were made by the browser test.

Primary references:
- [Mappls directions and via-point links](https://developer.mappls.com/mappls-apps/mappls-app/)
- [Mappls Android navigation links and app package](https://developer.mappls.com/mappls-apps/android/)

Android validation: offline :app:compileDebugJavaWithJavac passed. No APK assembly, install or on-device Mappls launch was performed. Existing SDK XML/flatDir warnings remain.
