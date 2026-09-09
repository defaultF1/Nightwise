# NightWise visual assets

Blue/navy with teal is the approved default. Mono Light and Mono Dark use the same content and a grayscale treatment of decorative imagery.

| Asset | Purpose | Location |
| --- | --- | --- |
| Navy launch video | Brief skippable ambient startup | public/assets/launch/nightwise-launch-navy-concept.mp4 |
| Launch poster | Static frame available immediately while media loads | public/assets/launch/nightwise-launch-poster.png |
| No route illustration | Empty route state | public/assets/illustrations/route-unavailable.png |
| Connection retry illustration | Recoverable error state | public/assets/illustrations/connection-retry.png |
| Incomplete evidence illustration | Unknown-data explanation | public/assets/illustrations/evidence-unknown.png |
| Activity illustration | About and explanation | public/assets/illustrations/activity-explained-v2.png |
| Crescent and controls | Editable real UI assets | src/components.tsx and lucide-react |
| Android icon and splash | Native NightWise brand | android/app/src/main/res/drawable and values |
| 24-state design references | Layout reference only | planning/assets/ui |

Higgsfield generated the raster assets. Prompts, model and job IDs are retained in illustrations/generation-record.json, illustrations/activity-correction.json and launch/generation-record.json. All four final illustrations were visually checked. The first activity-explanation image inserted unwanted opening-hours labels; the corrected v2 removes them and is used in the app. The first image remains generation history. Estimated total for this illustration pass including the correction was 17.5 existing credits; no credits were purchased. Decorative illustrations do not supply real maps, street conditions, measured light, opening hours or safety evidence.

Text, buttons, loading status, route selection, evidence diagrams and accessibility information are implemented as real UI. Existing concept boards are not flattened into application screens. No extra decorative video is needed for M2/M3.
