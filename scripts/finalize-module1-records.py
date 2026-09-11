from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
record_path = root / 'talks/records/2026-09-09_M01_app-shell_v01.json'
record = json.loads(record_path.read_text(encoding='utf-8'))
verification = json.loads((root / 'output/apk/module-01-verification.json').read_text(encoding='utf-8'))
assert verification['signatureVerified'] and verification['versionName'] == '0.1.0-module1'
for block in record['blocks']:
    value = block.get('text', '')
    if value.startswith('The Module 1 app shell is implemented'):
        block['text'] = 'Module 1 is complete within its app-shell scope. The Android debug APK builds successfully, its signature is verified and all five browser tests pass. The default is the original blue and navy appearance with teal accents. Mono Light and Mono Dark are available in Settings and the chosen appearance survives a reload. Physical phone behavior and live services remain later validation work.'
    elif value.startswith('Android compilation is in progress'):
        block['text'] = f"The final Android build passed in 5 minutes 7 seconds. The package is {verification['file']}, version {verification['versionName']}, {verification['sizeBytes']:,} bytes. Its signature and package identifier were verified. SHA256 is {verification['sha256']}. The native Back handler, status bar, touch handling and startup have not been checked on the intended physical phone. Live maps, route geometry, location services, activity analysis and billing are outside this module's verified scope."
    elif value.startswith('Word automation stalled'):
        block['text'] = 'Word automation stalled during report export and its read-only instance was stopped. The Windows runtime had no bundled LibreOffice. I extracted a verified official renderer privately under .tools and used the packaged document renderer with bundled Python and Poppler. The direct archive assembly reuses extracted files and validates directories once, avoiding repeated disk copying. Future reports use scripts/render-module-report.ps1.'
    elif value.startswith('A bundled Higgsfield navy launch background'):
        block['text'] = 'A bundled Higgsfield navy launch background with crisp UI branding, a Skip control and a short dismissal timer. The media was inspected and measured at 4.04 seconds, 720 by 1280 pixels. The app skips motion for reduced-motion preferences and can open without a network video. Android launcher and startup resources use the NightWise crescent and blue background.'
record_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding='utf-8')
prep_path = root / 'talks/records/2026-09-09_P00_preparation_v01.json'
prep = json.loads(prep_path.read_text(encoding='utf-8'))
for block in prep['blocks']:
    if block.get('type') == 'image' and 'theme-options' in block.get('path', ''):
        block['width'] = 6.0
prep_path.write_text(json.dumps(prep, indent=2, ensure_ascii=False), encoding='utf-8')
