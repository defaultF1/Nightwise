"""Execute production Lua in a local Redis emulator; no Google or Upstash requests.
Requires fakeredis[lua] (project-private test dependency or installed Python package).
"""
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / '.tools/redis-test-runtime'))
import fakeredis

script = re.search(r'export const RESERVE_SCRIPT = `(.*?)`;', (root/'server/redis-budget.ts').read_text(), re.S).group(1)
server = fakeredis.FakeServer()
client = fakeredis.FakeRedis(server=server, decode_responses=True)
key = 'test-budget'
initial = dict(routeCalls=16, nearbyCalls=641, autocompleteCalls=2, detailsCalls=2)
def reserve(kind='routeCalls', count=1, limit=21):
    c = fakeredis.FakeRedis(server=server, decode_responses=True)
    return c.eval(script, 1, key, kind, count, limit)[0]

assert reserve() == 'missing'
assert not client.exists(key), 'Missing counters must not become zero'
client.set(key, json.dumps(initial))
with ThreadPoolExecutor(max_workers=12) as pool:
    results = list(pool.map(lambda _: reserve(), range(30)))
assert results.count('ok') == 5 and results.count('exhausted') == 25, results
assert json.loads(client.get(key))['routeCalls'] == 21
assert client.pttl(key) == -1
assert reserve() == 'exhausted', 'A new client must preserve exhaustion'
assert reserve('nearbyCalls', 79, 720) == 'ok'
assert reserve('nearbyCalls', 1, 720) == 'exhausted'
assert json.loads(client.get(key))['nearbyCalls'] == 720
for raw in ['bad-json', '{}', json.dumps({**initial,'routeCalls':-1}), json.dumps({**initial,'nearbyCalls':0.5})]:
    client.set(key, raw)
    assert reserve() == 'invalid'
    assert client.get(key) == raw, 'Invalid data must never be overwritten'
client.set(key, json.dumps(initial), ex=60)
assert reserve() == 'invalid', 'Expiring counters are not durable allowances'
client.delete(key)
assert reserve() == 'missing'
print(json.dumps({'passed':True,'scope':'Local fakeredis Lua integration, no live provider requests','concurrentAttempts':30,'allowed':5,'blocked':25,'migrationAndNewClient':True,'nearbyCap':True,'missingCorruptExpiryFailClosed':True}))
