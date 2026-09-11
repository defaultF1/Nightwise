# Journey confirmation layout correction

The user reported clipped text and requested rounded corners. Endpoint cards now have 16 px inset padding, 18 px corners, separate borders and a 12 px gap. Names and addresses wrap without fixed text heights. The confirmation button has 18 px corners and a minimum 56 px height. The mobile sheet has all four corners rounded and extra space below its final action.

The base stylesheet is imported after journey-updates.css. Matching-specificity mobile rules were overriding the new sheet spacing and bottom corners; the targeted overrides now use the open dialog and sheet child selectors. Native transparent map windows remain separate from the opaque endpoint cards.

Verification: six browser layout cases cover 320 px and 390 px widths across Dark, Light and Blue, with a long endpoint name and native CSS state simulated. Google and API requests are blocked during these checks. See talks/records/rounded-confirmation-check.json and talks/screenshots/rounded-confirmation for results. The phone is disconnected, so this correction still needs visual confirmation on the physical Redmi after installation.

The Android update is version 0.7.7. Source is published on codex/journey-updates at 30291bc. Live personal testing remains enabled; no pause flags or request allowances were changed for this UI correction. This is a small UI follow-up to the M05 Word handoff, not a newly completed module.

## Physical verification

The Redmi reappeared after restarting ADB. Version 0.7.7 installed successfully. Actual screenshots confirm wrapped endpoint text, rounded cards and an unclipped confirmation button with 48.6 CSS px bottom clearance. Provider request counts stayed unchanged; one native map instance was opened. USB backend forwarding is restored and live service remains enabled. The native map still paints above the sheet top edge during scrolling, which remains a separate clipping issue. See talks/records/native-077-layout-check.json.
