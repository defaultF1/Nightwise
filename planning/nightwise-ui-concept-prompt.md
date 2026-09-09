# NightWise visual concept generation record

Purpose: planning-only UI concept with synthetic figures and schematic maps. Generated using the built-in image generation tool, not an external CLI. The written UX specification controls implementation details; the image is a design proposal.

Saved result: `planning/assets/nightwise-ui-concept.png` (1536 x 1024 PNG). Visually reviewed after generation. It shows journey entry, two-route comparison, and incomplete-evidence behavior. The maps and values are synthetic. Before implementation, add explicit route labels and distance on comparison cards and use the full Night Activity Score label specified in the UX document; these details are simplified in the concept. Any menu is limited to explanatory/privacy content, not accounts or new product modules.

## Final prompt

Use case: ui-mockup.

Asset type: a high fidelity mobile web app design concept board for planning only.

Create one polished landscape design board, approximately 1536x1024, showing three flat, front-on mobile interface frames for NightWise, a no-login route comparison app. Header at the top of the board: "NightWise". Subtitle: "UI concept · Illustrative data". The full mockups must fit within the canvas with generous margins.

Style: calm, refined, extremely legible product design, midnight navy surfaces, warm white text, restrained teal accents and muted blue alternate routes. Amber for uncertainty. Subtle borders, excellent spacing, realistic controls, clean modern sans serif. No neon, no decorative photos, no 3D device angles. This should feel practical for using at night.

Frame 1 caption above: "01 / Plan a journey". Within the UI show NightWise wordmark, heading "Compare night routes", brief subtext "See the activity tradeoff before you go.", origin input "Choose a starting point", secondary text button "Use my location", destination input "Where are you going?", a small "Driving" mode indicator, and primary button "Compare routes". Small bottom copy "No account needed".

Frame 2 caption above: "02 / Compare routes". Heading "Your route options". Small persistent tag "Sample data". A clear illustrative map panel with abstract street blocks and two distinct routes connecting the SAME origin and destination: teal selected route B and muted blue route A. Explicit small map label "Illustrative map". The map is a schematic, not actual navigation data. Below map put a teal-accented selected Route B card: badge "More active route", "35 min", "+4 min", "82/100", label "Estimated activity", and brief reason "More places listed as open". Then a compact Route A card: badge "Fastest", "31 min", "54/100". At bottom primary button "Open in Google Maps". Fine but readable text "Google Maps may update the route." Show all text without clipping.

Frame 3 caption above: "03 / Handle uncertainty". Heading "Limited activity data". Amber information icon and clear message "Not enough information to recommend a route." Small illustrative map area with muted routes and dotted unknown section. A neutral Route A card shows "31 min", "Opening hours incomplete", and a text link "View available details". No numeric score on this frame. Bottom primary button "Open in Google Maps", secondary action "Change journey". Small text "Activity estimates are not a safety guarantee."

Constraints: show exactly these three screens. Do not add login, profile, SOS, emergency sharing, location tracking, community reports, advertisements, shield badges, or turn-by-turn navigation. Never label routes safe or unsafe. Do not imply main-road or lighting evidence. All figures and maps are illustrative. No claim of live observations. Keep labels readable, calm, sparse and precise.
