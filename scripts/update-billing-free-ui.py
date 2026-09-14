from pathlib import Path
import json, re
root=Path(__file__).resolve().parents[1]
def edit(path,old,new):
    p=root/path;s=p.read_text(encoding='utf-8');assert old in s,path+': expected source not found';p.write_text(s.replace(old,new),encoding='utf-8')
edit('src/App.tsx',"import { PointPicker } from './PointPicker';","import { PointPicker } from './PointPicker';\nimport { RoadEvidence } from './RoadEvidence';")
edit('src/App.tsx',"setConnection(s.ready?", "setConnection(s.paused?'Backend connected. Google requests are paused while billing is pending.':s.ready?")
edit('src/App.tsx','<PointPicker value=', '<PointPicker accessCode={accessCode} value=')
edit('src/App.tsx','</dl><div className="evidence-footnotes">','</dl><RoadEvidence analysis={liveResult?.roadAnalyses?.[selectedRoute.id]}/><div className="evidence-footnotes">')
edit('src/App.tsx','Lighting, road classification and crime are not measured.','Lighting and crime are not measured. Road classification is shown separately when available.')
edit('src/App.tsx','Bengaluru · supplied pin</span></span><Building2','Bengaluru · selected destination</span></span><Building2')
edit('src/App.tsx','Results stay in memory for the session; only request counts are saved by the backend.','Place searches send the text you explicitly submit to our backend and Google when enabled. Results stay in memory for the session; only request counts are saved by the backend. OpenStreetMap road data is stored locally; your route is not written to that extract.')
edit('src/maps/adapter.ts','  if (Capacitor.isNativePlatform()) {', "  if (import.meta.env.VITE_ENABLE_LIVE_MAPS !== 'true') throw new Error('Maps paused');\n  if (Capacitor.isNativePlatform()) {")
edit('src/LiveMap.tsx',"{error ? 'Map unavailable.","{import.meta.env.VITE_ENABLE_LIVE_MAPS !== 'true' ? 'Live maps are paused while billing is pending. Tutorial mode remains available.' : error ? 'Map unavailable.")
edit('android/app/build.gradle','versionCode 5','versionCode 6')
edit('android/app/build.gradle','0.5.0-pilot','0.6.0-prebilling')
edit('tests/unit/live.test.ts',"GOOGLE_MAPS_SERVER_KEY: 'test-key-not-real',","ENABLE_LIVE_REQUESTS: 'true', ROAD_DATA_PATH:'missing-test-road-file', GOOGLE_MAPS_SERVER_KEY: 'test-key-not-real',")
edit('tests/unit/live.test.ts','{routeCalls:2,nearbyCalls:2}','{routeCalls:2,nearbyCalls:2,autocompleteCalls:0,detailsCalls:0}')
edit('tests/unit/live.test.ts',"['nearbyCalls','routeCalls']","['autocompleteCalls','detailsCalls','nearbyCalls','routeCalls']")
p=root/'src/styles.css';p.write_text(p.read_text()+ '\n.place-search{margin-bottom:24px}.place-search .secondary-button{width:100%}.search-notice{padding:12px 0;color:var(--muted);font-size:13px;line-height:1.6}.road-evidence{margin-top:24px}.road-evidence h3{font-size:16px}.road-evidence a{color:var(--accent)}.origin-option small{overflow-wrap:anywhere}.origin-option:disabled{opacity:.6}\n',encoding='utf-8')
settings={'ENABLE_LIVE_REQUESTS':'false','ENABLE_PLACE_SEARCH':'false','ENABLE_ACTIVITY_ANALYSIS':'false','ENABLE_EXPERIMENTAL_SCORING':'false','PILOT_AUTOCOMPLETE_LIMIT':'40','PILOT_DETAILS_LIMIT':'20','ROAD_DATA_PATH':'data/roads/north-bengaluru-overpass.json'}
for relative,values in [('.env',settings),('.env.example',{**settings,'VITE_ENABLE_LIVE_MAPS':'false'}),('.env.local',{'VITE_ENABLE_LIVE_MAPS':'false'})]:
    p=root/relative;s=p.read_text(encoding='utf-8')
    for key,value in values.items():
        pattern=r'(?m)^'+key+r'=[^\r\n]*'
        s=re.sub(pattern,key+'='+value,s) if re.search(pattern,s) else s.rstrip()+'\n'+key+'='+value+'\n'
    p.write_text(s,encoding='utf-8')
p=root/'package.json';data=json.loads(p.read_text());data['scripts']['build:server']='esbuild server/index.ts --bundle --platform=node --format=esm --packages=external --outfile=build-server/index.mjs';p.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
print('Updated app, tests, version and paused-service configuration. No credential values displayed.')
