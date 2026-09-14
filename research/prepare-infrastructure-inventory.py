"""Reproduce the research inventory from the cited public snapshot; not app ingestion."""
import csv
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://www.thetraffic.in/data/surveillance_cameras.v1.json'
raw = json.loads((ROOT / 'tmp/infrastructure-research/cameras-snapshot.json').read_text(encoding='utf-8-sig'))
out = ROOT / 'research/infrastructure'
out.mkdir(exist_ok=True)
aeos = (13.0628268, 77.5940888)
manyata = (13.047697, 77.619939)

def distance(a, b):
    p, q = map(math.radians, [a[0], b[0]])
    x = math.sin((q-p)/2)**2 + math.cos(p)*math.cos(q)*math.sin(math.radians(b[1]-a[1])/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(x)))

rows = []
for record in raw['records']:
    point = (record['lat'], record['lon'])
    da, dm = distance(aeos, point), distance(manyata, point)
    # Match the existing service region; report the second radius separately.
    if da > 20000:
        continue
    tags = record['tags']
    kind, access = tags.get('surveillance:type', ''), tags.get('surveillance', '')
    state = ('excluded-private-or-indoor' if access in ('private', 'indoor')
             else 'excluded-non-camera' if kind not in ('camera', 'ALPR', 'alpr')
             else 'candidate-public-outdoor' if access in ('public', 'outdoor', 'traffic')
             else 'review-access-unknown')
    rows.append(dict(osm_id=f"node/{record['id']}", name=tags.get('name', ''), latitude=point[0], longitude=point[1],
        distance_from_aeos_m=round(da), distance_from_manyata_m=round(dm),
        within_manyata_20km=dm <= 20000, category=access, equipment_type=kind,
        direction=tags.get('camera:direction', tags.get('direction', '')), survey_date=tags.get('survey:date', tags.get('check_date', '')),
        osm_last_edit=record.get('t', ''), snapshot_base=raw['meta']['osm_base'], review_state=state,
        working_status='unknown', source_url=f"https://www.openstreetmap.org/node/{record['id']}",
        snapshot_url=SOURCE, license='ODbL-1.0'))
rows.sort(key=lambda r: r['distance_from_aeos_m'])
with (out / 'aeos-20km-camera-records.csv').open('w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
summary = dict(source=SOURCE, snapshot_base=raw['meta']['osm_base'], retrieved_date='2026-09-14',
    attribution=raw['meta']['attribution'], license='https://opendatacommons.org/licenses/odbl/1-0/',
    scope='20 km great-circle radius from existing AEOS pin; source is clipped to Bengaluru administrative area',
    source_total=len(raw['records']), within_aeos_20km=len(rows),
    within_both_20km=sum(r['within_manyata_20km'] for r in rows),
    review_states=dict(Counter(r['review_state'] for r in rows)),
    survey_date_present=sum(bool(r['survey_date']) for r in rows), direction_present=sum(bool(r['direction']) for r in rows),
    nearest_candidates=[r for r in rows if r['review_state']=='candidate-public-outdoor'][:12])
(out / 'inventory-summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='nearest_candidates'}, indent=2))

signals = json.loads((ROOT / 'tmp/infrastructure-research/intersections-snapshot.json').read_text(encoding='utf-8-sig'))
signal_rows = []
for r in signals['intersections']:
    d = distance(aeos, (r['lat'], r['lon']))
    if d <= 20000:
        signal_rows.append(dict(source_id=r['id'], name=r['canonical_name'], latitude=r['lat'], longitude=r['lon'],
            distance_from_aeos_m=round(d), intersection_type=r['intersection_type'],
            control_type=r['control_type'], osm_node_ids=';'.join(map(str,r['osm_node_ids'])),
            source_review_needed=r['review_needed'], verified=r['verified'],
            snapshot_base=signals['meta']['source']['osm_timestamp_base'],
            source_url='https://www.thetraffic.in/data/intersections.v1.json',license='ODbL-1.0'))
signal_rows.sort(key=lambda r:r['distance_from_aeos_m'])
with (out / 'aeos-20km-signal-records.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.DictWriter(f,fieldnames=list(signal_rows[0]));writer.writeheader();writer.writerows(signal_rows)
summary['signals'] = dict(source_total=len(signals['intersections']),within_aeos_20km=len(signal_rows),
    raw_nodes=sum(len(r['osm_node_ids'].split(';')) for r in signal_rows),
    snapshot_base=signals['meta']['source']['osm_timestamp_base'],source_bbox=signals['meta']['bbox'],
    source_verified=sum(r['verified'] for r in signal_rows),
    nearest=signal_rows[:12])
(out / 'inventory-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in summary['signals'].items() if k!='nearest'},indent=2))
