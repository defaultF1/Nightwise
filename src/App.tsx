import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, ExternalLink, Info, LocateFixed, MapPin, Navigation, Palette, Settings2, Store, Building2, Route as RouteIcon, CarFront } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { MoonMark, Sheet } from './components';
import { RouteDiagram } from './RouteDiagram';
import { JourneySummary } from './JourneySummary';
import { Illustration } from './Illustration';
import { LaunchScreen } from './LaunchScreen';
import { LiveMap } from './LiveMap';
import { PointPicker } from './PointPicker';
import { EvidenceConfidence } from './EvidenceConfidence';
import { HelpPoints } from './HelpPoints';
import { ShopHours } from './ShopHours';
import { compareActivity } from './domain/comparison';
import { RoadEvidence } from './RoadEvidence';
import { DEFAULT_JOURNEY, regionForPoint, sameServiceRegion, type LiveJourney } from './domain/journey';
import { liveComparison, serviceStatus } from './providers/live';
import { mapsHandoff } from './domain/handoff';
import { currentLocation, openMaps, openLocationSettings, openAppSettings, setNativeBackground } from './native';
import type { LiveResult } from './domain/live-contract';
import { createSampleRouteProvider, JourneyError, abortableDelay } from './providers/routes';
import { ActivityStrip, formatGap } from './ActivityStrip';
import { LiveScore } from './LiveScore';
import { ScoreBreakdown } from './ScoreBreakdown';
import { analyzeComparison } from './domain/analyze-comparison';
import { fixtureScans, fixtureRoadEvidence, TUTORIAL_CHECKED_AT } from './data/activity-fixtures';
import type { ActivityAnalysis, Comparison } from './domain/activity-types';
import { applyTheme, saveTheme, themes, type Theme } from './theme';
import { type TutorialScenario } from './data/tutorial';
import type { RouteWithEvidence } from './domain/types';
import './journey-updates.css';

type View = 'plan' | 'loading' | 'routes' | 'error';
type Modal = 'settings' | 'origin' | 'destination' | 'confirm' | 'evidence' | 'handoff' | 'about' | 'location' | null;
const scenarioOptions: [TutorialScenario, string][] = [['normal', 'Two route options'], ['three', 'Three route options'], ['one', 'One available route'], ['limited', 'Incomplete activity data'], ['unknown', 'All evidence unavailable'], ['capped', 'Search result limit'], ['closing', 'Places closing soon'], ['detour', 'Substantial detour'], ['similar', 'Similar activity'], ['none', 'No routes returned'], ['error', 'Connection problem']];
const minutes = (r: RouteWithEvidence) => Math.round(r.durationSeconds / 60);
const routeProvider = createSampleRouteProvider();

export function App({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [journey, setJourney] = useState<LiveJourney>(DEFAULT_JOURNEY);
  const origin = journey.origin.name, destination = journey.destination.name;
  const [dataMode, setDataMode] = useState<'sample'|'live'>('sample');
  const city=dataMode==='sample'?'Bengaluru':regionForPoint(journey.origin)?.city??'Bengaluru';
  const needsDestination=dataMode==='live'&&!sameServiceRegion(journey.origin,journey.destination);
  const [showMap, setShowMap] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveResult|null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [connection, setConnection] = useState('Check the live service without using Google requests.');
  const [locationMessage, setLocationMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [stale, setStale] = useState(false);
  const locationId = useRef(0);
  const [view, setView] = useState<View>('plan');
  const [modal, setModal] = useState<Modal>(null);
  const [scenario, setScenario] = useState<TutorialScenario>('normal');
  const [routes, setRoutes] = useState<RouteWithEvidence[]>([]);
  const [selected, setSelected] = useState('activity');
  const [splash, setSplash] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const closeLaunch = useCallback(() => setSplash(false), []);
  const [errorMessage, setErrorMessage] = useState('');
  const [analyses,setAnalyses]=useState<ActivityAnalysis[]>([]);
  const [providerComparison,setComparison]=useState<Comparison|null>(null);
  const [extraMinutes,setExtraMinutes]=useState(()=>{try{const n=Number(localStorage.getItem('nightwise.extraMinutes')??10);return [0,5,10,15].includes(n)?n:10;}catch{return 10;}});
  const comparison = providerComparison && (dataMode==='sample'||Object.keys(providerComparison.scores).length>0)
    ? compareActivity(routes,analyses,dataMode==='sample'?fixtureRoadEvidence(routes,scenario):Object.fromEntries(routes.map(r=>[r.id,{...liveResult?.roadAnalyses?.[r.id],...(r.turns!==undefined?{maneuversPerKm:r.turns/(r.distanceMeters/1000)}:{})}])),{allowLive:dataMode==='live',maxExtraMinutes:extraMinutes}) : providerComparison;
  const [stage,setStage]=useState<'routes'|'activity'>('routes');
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const selectedRoute = routes.find(r => r.id === selected) ?? routes[0];
  const selectedAnalysis=analyses.find(a=>a.routeId===selectedRoute?.id);
  const fastest = routes.length ? Math.min(...routes.map(minutes)) : 0;
  const modalRef = useRef(modal); modalRef.current = modal;
  const viewRef = useRef(view); viewRef.current = view;
  const splashRef = useRef(splash); splashRef.current = splash;
  const liveRef = useRef(liveResult); liveRef.current = liveResult;
  useEffect(()=>{if(comparison?.selectedId)setSelected(comparison.selectedId);},[providerComparison,extraMinutes]);

  useEffect(() => {
    applyTheme(theme);
    if (Capacitor.isNativePlatform()) {
      void setNativeBackground(theme === 'blue' ? '#081725' : theme === 'dark' ? '#080808' : '#f6f6f4').catch(() => {});
      void StatusBar.setStyle({ style: theme === 'light' ? Style.Light : Style.Dark }).catch(() => {});
      void StatusBar.setBackgroundColor({ color: theme === 'blue' ? '#081725' : theme === 'dark' ? '#080808' : '#f6f6f4' }).catch(() => {});
    }
  }, [theme]);

  function cancel() {
    requestId.current++;
    controller.current?.abort();
    setRoutes([]);
    setAnalyses([]);setComparison(null);
    setLiveResult(null);setStale(false);
    setSelected('');
    setView('plan');
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener('backButton', () => {
      if (splashRef.current) void NativeApp.minimizeApp();
      else if (modalRef.current) { locationId.current++; setLocating(false); setModal(null); }
      else if (viewRef.current !== 'plan') cancel();
      else void NativeApp.minimizeApp();
    });
    const resume = NativeApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && viewRef.current === 'loading') cancel();
      if (isActive && liveRef.current && Date.now()-Date.parse(liveRef.current.checkedAt)>5*60_000) setStale(true);
    });
    return () => { void listener.then(h => h.remove()); void resume.then(h => h.remove()); };
  }, []);

  useEffect(() => () => { requestId.current++; controller.current?.abort(); }, []);
  useEffect(() => {
    const check = () => { if (liveRef.current && Date.now()-Date.parse(liveRef.current.checkedAt)>5*60_000) setStale(true); };
    document.addEventListener('visibilitychange', check); const timer = setInterval(check,30000);
    return () => { document.removeEventListener('visibilitychange',check); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!splash && view !== 'loading') document.getElementById('page-heading')?.focus();
  }, [view, splash]);

  async function compare(nextScenario: TutorialScenario = scenario) {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    const id = ++requestId.current;
    setRoutes([]);
    setAnalyses([]);setComparison(null);setStage('routes');
    setSelected('');
    setView('loading');
    try {
      if (dataMode === 'live') {
        const result = await liveComparison(journey, current.signal, accessCode);
        if (id !== requestId.current || current.signal.aborted) return;
        setLiveResult(result); setStale(false); setShowMap(true);
        setAnalyses(result.analyses); setComparison(result.comparison);
        setRoutes(result.routes.map(route => { const a=result.analyses.find(a=>a.routeId===route.id); return {...route,evidence:{openPlaces:a?.openPlaces??null,potentialHelpPoints:a?.potentialHelpPoints??null,longestLowActivityMeters:a?.longestLowActivityMeters??null,coverage:a?.scanCoverage??0,checkedAt:result.checkedAt,source:'live'}}; }));
        setSelected(result.comparison.selectedId??result.routes[0]?.id??''); setView('routes'); return;
      }
      const result = await routeProvider.getRoutes({origin:journey.origin.name==='Manyata Tech Park'?'Manyata Tech Park':'AEOS',destinationId:'aeos',mode:'DRIVE',scenario:nextScenario},current.signal);
      if (id !== requestId.current) return;
      setStage('activity');
      await abortableDelay(0,current.signal);
      const analysis=analyzeComparison(result,plan=>fixtureScans(plan,nextScenario),TUTORIAL_CHECKED_AT,fixtureRoadEvidence(result,nextScenario));
      if(id!==requestId.current||current.signal.aborted)return;
      const next = result.map((route,i) => ({...route,evidence:{openPlaces:analysis.analyses[i].openPlaces,potentialHelpPoints:analysis.analyses[i].potentialHelpPoints,longestLowActivityMeters:analysis.analyses[i].longestLowActivityMeters,coverage:analysis.analyses[i].scanCoverage,checkedAt:TUTORIAL_CHECKED_AT,source:'sample' as const}}));
      setAnalyses(analysis.analyses);setComparison(analysis.comparison);
      setRoutes(next);
      setSelected(analysis.comparison.selectedId??'');
      setView('routes');
    } catch (error) {
      if (id !== requestId.current || current.signal.aborted) return;
      setErrorMessage(error instanceof JourneyError ? error.message : 'The route preview could not be read.');
      setView('error');
    }
  }

  function changeTheme(next: Theme) { void saveTheme(next); setTheme(next); }
  const handoffUrl = mapsHandoff(journey);
  async function locate() {
    const id=++locationId.current; setLocating(true); setLocationMessage('Finding your location…');
    try { const point=await currentLocation(); if(id!==locationId.current)return; setJourney(j=>({...j,origin:point}));setDataMode('live');setLocationMessage('');cancel();setModal(null); }
    catch(e) { if(id===locationId.current)setLocationMessage(e instanceof Error?e.message:'Location unavailable.'); }
    finally { if(id===locationId.current)setLocating(false); }
  }
  async function checkConnection() {
    setConnection('Waking and checking the live service… Free hosting can take about a minute after inactivity.');
    try { const s=await serviceStatus(); setConnection(s.paused?'Backend connected. Google requests are paused to control usage.':s.ready?`Backend ready. Activity scans ${s.activityEnabled?'enabled':'off'}. Live scoring ${s.scoringEnabled?'experimental':'pending validation'}.`:'Backend connected. Add the restricted server key to enable live routes.'); }
    catch { setConnection('The hosted service could not be reached. Check your internet connection and try again; free hosting may be waking up.'); }
  }

  return <><div className="app-shell" inert={splash}>
    <header className="app-header">
      <button className="brand" onClick={cancel} aria-label="NightWise home"><MoonMark /><span>NightWise</span></button>
      <div className="header-actions"><span className="city-label"><MapPin size={14} /> {city}</span><button className="icon-button" aria-label="Open settings" onClick={() => setModal('settings')}><Settings2 size={21} /></button></div>
    </header>

    <main className={view === 'plan' ? 'plan-main' : 'journey-main'} aria-busy={view === 'loading'}>
      {view === 'plan' ? <>
        <section className="hero"><span className="eyebrow"><span /> MADE FOR YOUR WAY HOME</span><h1 id="page-heading" tabIndex={-1}>A little more insight.<br /><span>A better way home.</span></h1><p>Compare night routes with a clearer view<br className="desktop-break" /> of the activity along the way.</p><div className="hero-orbit" aria-hidden="true"><MoonMark size={100} /><span className="orbit orbit-one" /><span className="orbit orbit-two" /></div></section>
        <div className="mode-switch" role="group" aria-label="Data mode"><button aria-pressed={dataMode==='sample'} onClick={()=>{cancel();setDataMode('sample');setJourney(DEFAULT_JOURNEY);setShowMap(false);}}>Tutorial mode</button><button aria-pressed={dataMode==='live'} onClick={()=>{cancel();setDataMode('live');}}>Live routes</button></div>
        <section className="plan-card" aria-labelledby="journey-title">
          <div className="section-top"><h2 id="journey-title">Where are you heading?</h2><span className="small-label">{city.toUpperCase()}</span></div>
          <div className="place-fields"><div className="field-marker"><span /><i /><MapPin size={19} /></div><div className="field-controls">
            <button className="place-field" disabled={dataMode==='sample'} onClick={() => setModal('origin')}><span><small>FROM</small><strong>{origin}</strong>{dataMode==='live'&&journey.origin.address&&<span className="secondary-address">{journey.origin.address}</span>}</span><ChevronDown size={18} /></button>
            <button className="place-field destination" disabled={dataMode==='sample'} onClick={() => setModal('destination')}><span><small>TO</small><strong>{needsDestination?`Choose destination in ${city}`:destination}</strong><span className="secondary-address">{needsDestination?'Search for a place or street':journey.destination.address??`${city} · selected destination`}</span></span><Building2 size={20} /></button>
          </div></div>
          <button className="text-button location-action" onClick={() => setModal('location')}><LocateFixed size={16} /> Use my location</button>
          <div className="journey-tools"><button className="secondary-button" onClick={()=>{locationId.current++;setLocating(false);cancel();setJourney(j=>({...j,origin:j.destination,destination:j.origin}));}}>Swap origin and destination</button><button className="text-button" onClick={()=>{cancel();setJourney(DEFAULT_JOURNEY);}}>AEOS → Manyata preset</button></div>
          <label className="time-preference">Extra travel time to consider<select aria-label="Extra travel time" value={extraMinutes} onChange={e=>{const n=Number(e.target.value);setExtraMinutes(n);try{localStorage.setItem('nightwise.extraMinutes',String(n));}catch{/* Session preference remains usable. */}}}>{[0,5,10,15].map(n=><option key={n} value={n}>{n===0?'Fastest only':`Up to ${n} extra minutes`}</option>)}</select></label>
          <div className="trip-settings"><span><CarFront size={19} /> Driving</span><span><Clock3 size={17} /> {dataMode==='sample'?'8:30 pm':'Leave now'}</span></div>
          {needsDestination&&<p className="settings-helper">Your starting point is in {city}. Choose a destination in the same city to compare routes.</p>}
          <button className="primary-button" disabled={needsDestination} onClick={() => dataMode==='live'?setModal('confirm'):void compare()}>Compare night routes <ArrowRight size={20} /></button>
          <div className="tutorial-note"><Info size={16} /><p>{dataMode==='sample'?<>AEOS ↔ Manyata Tech Park. Swap the direction to explore the return journey.</>:<>Live Google routes use the pilot allowance. Activity may remain unassessed if scans are off or incomplete.</>}</p></div>
        </section>
        {dataMode==='live'&&!needsDestination&&<div className="plan-map"><button className="secondary-button" onClick={()=>setShowMap(v=>!v)}>{showMap?'Hide map':`Show ${city} map`}</button>{showMap&&!modal&&<LiveMap routes={[]} onSelect={()=>{}} journey={journey} theme={theme} blocked={splash}/>}</div>}
        <div className="how-it-works"><span><RouteIcon size={18} /> Compare your options</span><span><Store size={18} /> Understand the activity</span><span><Navigation size={18} /> Continue in Maps</span></div>
        <p className="quiet-note">Activity is an estimate, not a safety rating. <button onClick={() => setModal('about')}>About NightWise</button></p>
      </> : <>
        <button className="back-link" onClick={cancel}><ArrowLeft size={18} /> Edit journey</button>
        <div className="journey-heading"><div><h1 id="page-heading" tabIndex={-1}>{view === 'loading' ? 'Getting your preview ready' : view === 'error' ? 'Let’s try that again' : 'Your route options'}</h1><p>{origin} <ArrowRight size={14} /> {destination}</p></div><span className="sample-badge">{dataMode==='sample'?'Tutorial mode':'Live request'}</span></div>
        {view === 'loading' ? <section className="state-panel" role="status"><div className="loading-ring" /><h2>{stage==='routes'?(dataMode==='sample'?'Loading your routes':'Requesting live routes and evidence'):'Calculating activity evidence'}</h2><p>{dataMode==='live'?'Checking the journey within the pilot allowance. After free hosting has been idle, this can take up to three minutes.':stage==='routes'?'Preparing the selected tutorial journey.':'Checking places and comparing the activity along each route.'}</p><div className="analysis-stages"><span className={stage==='activity'?'done':''}>{stage==='activity'?<Check size={15}/>:<span className="stage-dot"/>} Route options</span><span>{stage==='activity'?<span className="stage-dot"/>:<span className="stage-pending"/>} Activity and comparison</span></div><button className="secondary-button" onClick={cancel}>Cancel</button></section>
        : view === 'error' ? <section className="state-panel"><Illustration name="connection-retry"/><h2>We couldn’t load routes</h2><p>{errorMessage} Your journey is saved.</p><button className="primary-button" onClick={() => { setScenario('normal'); void compare('normal'); }}>{dataMode==='sample'?'Retry journey':'Retry live journey'} <ArrowRight size={18} /></button><button className="text-button" onClick={cancel}>Back to journey</button></section>
        : <><JourneySummary routes={routes} comparison={comparison} analyses={analyses} onSelect={setSelected}/><div className="results-layout">{dataMode==='live'?<LiveMap routes={routes} selectedId={selectedRoute?.id} onSelect={setSelected} journey={journey} theme={theme} blocked={!!modal||splash} analysis={selectedAnalysis}/>:<RouteDiagram routes={routes} selectedId={selectedRoute?.id} onSelect={setSelected} origin={origin} destination={destination}/>}<div className="results-panel">
          {!routes.length ? <section className="state-panel"><Illustration name="route-unavailable"/><h2>No routes in this preview</h2><p>Try another starting point or change the tutorial scenario.</p><button className="secondary-button" onClick={cancel}>Edit journey</button></section> : <>
            <div className="freshness"><span>{dataMode==='sample'?'Journey time: 8:30 pm IST':`Checked ${liveResult?new Date(liveResult.checkedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'just now'} IST`}{stale?' · Over five minutes old':''}</span><button className="text-button" onClick={()=>void compare()}>{dataMode==='sample'?'Restart journey':'Refresh live results'}</button></div>
            <p className="preference-note">Considering up to {extraMinutes} extra minutes.</p>
            {routes.length === 1 && <p className="single-route-note">Only one route was returned in this preview.</p>}
            <div className="route-list" role="radiogroup" aria-label="Select a route">
              {[...routes].sort((a,b)=>Number(b.id===comparison?.recommendedId)-Number(a.id===comparison?.recommendedId)||(comparison?.scoreBounds?0:(comparison?.scores[b.id]??-1)-(comparison?.scores[a.id]??-1))||a.durationSeconds-b.durationSeconds||a.id.localeCompare(b.id)).map(route => <div key={route.id} className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}>
                <label className="route-select"><input type="radio" name="route" aria-label={route.label} checked={selectedRoute?.id === route.id} onChange={() => setSelected(route.id)} /><span className="route-content"><span className="route-card-top"><span>{route.label}{comparison?.rankedIds?.includes(route.id)?` · Activity rank ${comparison.rankedIds.indexOf(route.id)+1}`:''}</span><span className="selection-check" aria-hidden="true">{selectedRoute?.id === route.id ? <Check size={14} /> : null}</span></span>{comparison?.recommendedId===route.id&&<span className="activity-label recommendation-label">{dataMode==='sample'?'More listed activity':'More listed activity · experimental'}</span>}{comparison?.scoreBounds?.[route.id]&&<LiveScore comparison={comparison} id={route.id}/>} {comparison?.scores[route.id]!==undefined&&!comparison.scoreBounds?.[route.id]&&<span className="activity-score">Night Activity Score <b>{Math.round(comparison.scores[route.id])}/100</b><small>{comparison.commonComponents.length}/6 signals · {comparison.commonComponents.length<6?'Partial · ':''}{dataMode==='sample'?'Activity comparison':'Experimental · uncalibrated'}</small></span>}{dataMode==='live'&&comparison?.scores[route.id]===undefined&&<span className="score-unavailable">Night Activity Score <b>Unavailable</b><small>A validated score is not available for this live route. Review the evidence below.</small></span>}<span className="route-duration">{minutes(route)} <small>min</small></span><span className="route-distance">{(route.distanceMeters / 1000).toFixed(1)} km {minutes(route) > fastest ? <span> · +{minutes(route) - fastest} min</span> : <span> · quickest option</span>}</span><span className="route-summary">{route.evidence.openPlaces===null?'Activity evidence is unavailable':`${route.evidence.openPlaces} places listed as open around your passing time`}</span></span></label>
                {analyses.find(a=>a.routeId===route.id)&&<ActivityStrip analysis={analyses.find(a=>a.routeId===route.id)!} compact/>}
                <button className="evidence-button" onClick={() => { setSelected(route.id); setModal('evidence'); }}>View activity details <ChevronRight size={16} /></button>
              </div>)}
            </div>
            <EvidenceConfidence analysis={selectedAnalysis} road={liveResult?.roadAnalyses?.[selectedRoute?.id]}/>
            <details className="help-details"><summary>Help points on selected route</summary><HelpPoints analysis={selectedAnalysis}/></details><ShopHours analysis={selectedAnalysis}/>
            {liveResult&&<details className="live-notices"><summary>Data sources and notes</summary>{liveResult.notices.map(n=><p key={n}>{n}</p>)}{liveResult.attributions.map((a,i)=><p key={i}>{a.uri?<a href={a.uri} target="_blank" rel="noreferrer">{a.name}</a>:a.name}</p>)}</details>}
            <p className="route-disclaimer"><Info size={15} /> Activity estimate, not a safety rating.</p>
            <button className="primary-button" onClick={() => {setLocationMessage('');setModal('handoff');}}>Continue with this route <ArrowRight size={20} /></button>
            <p className="handoff-note">Google Maps may update the route.<br />Check its preview before starting.</p>
          </>}
        </div></div></>}
      </>}
    </main>

    <footer className="app-footer"><span>NightWise · {city}, India</span><button onClick={() => setModal('about')}>How it works</button></footer>

    {modal==='confirm'&&<Sheet title="Confirm your journey" onClose={()=>setModal(null)}><p className="sheet-intro">Step 1 of 2 · Check your starting pin and destination entrance. Confirm below to fetch road routes; you can then choose an alternative.</p><LiveMap routes={[]} onSelect={()=>{}} journey={journey} theme={theme} blocked={false}/><dl className="endpoint-confirmation">{(['origin','destination'] as const).map((key,i)=><div key={key}><dt>{i?'B · Destination':'A · Starting point'}</dt><dd><strong>{journey[key].name}</strong><span>{journey[key].address??'Street address unavailable — check this pin and entrance.'}</span><span>{journey[key].latitude.toFixed(6)}, {journey[key].longitude.toFixed(6)}</span><button className="text-button" onClick={()=>setModal(key)}>Change {i?'destination':'origin'}</button></dd></div>)}</dl><button className="primary-button" onClick={()=>{setModal(null);void compare();}}>Confirm and compare</button></Sheet>}

    {modal === 'settings' && <Sheet title="Make it yours" onClose={() => setModal(null)}><p className="sheet-intro">Choose the appearance that feels right for you.</p><h3 className="settings-label"><Palette size={16} /> Appearance</h3><div className="theme-options" role="radiogroup" aria-label="Appearance">{themes.map(t => <label className={`theme-option ${theme === t.id ? 'active' : ''}`} key={t.id}><input type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => changeTheme(t.id)} /><span className={`theme-preview ${t.id}`}><i /><i /><i /></span><span><strong>{t.name}</strong><small>{t.description}</small></span>{theme === t.id && <CheckCircle2 size={20} />}</label>)}</div><p className="settings-helper">Your appearance is remembered on this device.</p><button className="secondary-button replay-launch" onClick={() => { setModal(null); setSplash(true); }}>Replay intro</button><details className="tutorial-controls"><summary>Live service</summary><p>{connection}</p><button className="secondary-button" onClick={()=>void checkConnection()}>Check connection</button>{liveResult&&<p className="settings-helper">Pilot usage: {liveResult.usage.routeCalls}/{liveResult.usage.routeLimit} route calls · {liveResult.usage.nearbyCalls}/{liveResult.usage.nearbyLimit} nearby searches.</p>}<label htmlFor="access-code">Team access code if required</label><input id="access-code" type="password" autoComplete="off" value={accessCode} onChange={e=>setAccessCode(e.target.value)} maxLength={120}/><small>Kept only for this session. Never enter a Google API key here.</small></details><details className="tutorial-controls"><summary>Tutorial scenarios</summary><p>Choose a journey scenario for the walkthrough.</p><label htmlFor="scenario">Preview scenario</label><select id="scenario" value={scenario} onChange={e => { setScenario(e.target.value as TutorialScenario);setDataMode('sample');setJourney(DEFAULT_JOURNEY);setShowMap(false); cancel(); }}>{scenarioOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><small>Scenario changes reset the route preview.</small></details><button className="primary-button" onClick={() => setModal(null)}>Done <Check size={19} /></button></Sheet>}
    {(modal==='origin'||modal==='destination')&&<Sheet title={modal==='origin'?'Choose your starting point':'Choose your destination'} onClose={()=>setModal(null)}><PointPicker anchor={modal==='origin'?journey.destination:journey.origin} direction={modal==='origin'?'to-anchor':'from-anchor'} accessCode={accessCode} value={modal==='origin'?journey.origin:journey.destination} onChoose={point=>{setJourney(j=>({...j,[modal==='origin'?'origin':'destination']:point}));const expected=modal==='origin'?DEFAULT_JOURNEY.origin:DEFAULT_JOURNEY.destination;if(point.latitude!==expected.latitude||point.longitude!==expected.longitude||point.name!==expected.name)setDataMode('live');cancel();setModal(null);}}/></Sheet>}
    {modal === 'evidence' && selectedRoute && !selectedAnalysis && <Sheet title="A closer look at this route" onClose={()=>setModal(null)}><p className="evidence-lead">{selectedRoute.label} · {minutes(selectedRoute)} minutes</p><p>This live response includes the route, but no shop analysis. {liveResult?.activityStatus==='budget'?'The current request allowance cannot cover this scan.':'Activity scanning is unavailable or switched off.'}</p><EvidenceConfidence road={liveResult?.roadAnalyses?.[selectedRoute.id]}/><HelpPoints/><RoadEvidence analysis={liveResult?.roadAnalyses?.[selectedRoute.id]}/><button className="secondary-button" onClick={()=>setModal(null)}>Back to routes</button></Sheet>}
    {modal === 'evidence' && selectedRoute && selectedAnalysis && <Sheet title="A closer look at this route" onClose={() => setModal(null)}><span className="sample-badge">{dataMode==='sample'?'Tutorial mode':'Live Google listings · estimates'}</span><p className="evidence-lead">{selectedRoute.label} · {minutes(selectedRoute)} minutes<br/><span>Here’s what the evidence can tell us.</span></p>{!selectedAnalysis.coreComparable&&<div className="unknown-explanation"><Illustration name="evidence-unknown" compact/><p>Some evidence is missing. Unassessed areas are unknown, not low activity.</p></div>}<ActivityStrip analysis={selectedAnalysis}/><dl className="evidence-rows">{selectedAnalysis.openPlaces!==null&&<div><dt>Listed places nearby</dt><dd>{selectedAnalysis.openPlaces} open · {selectedAnalysis.closedPlaces} closed · {selectedAnalysis.unknownHours} unknown</dd></div>}{selectedAnalysis.potentialHelpPoints!==null&&<div><dt>Help listings scheduled open around arrival</dt><dd>{selectedAnalysis.potentialHelpPoints}</dd></div>}<div><dt>Longest stretch without an open help listing</dt><dd>{formatGap(selectedAnalysis.helpGapBounds,selectedAnalysis.longestHelpGapMeters)}</dd></div><div><dt>Longest low-activity stretch</dt><dd>{formatGap(selectedAnalysis.lowActivityGapBounds,selectedAnalysis.longestLowActivityMeters)}</dd></div>{selectedAnalysis.openTransportPoints!==null&&<div><dt>Transport locations listed as open</dt><dd>{selectedAnalysis.openTransportPoints}</dd></div>}{!!selectedAnalysis.closingSoon&&<div><dt>Listed places closing soon</dt><dd>{selectedAnalysis.closingSoon}</dd></div>}{dataMode==='sample'&&<div><dt>Journey time</dt><dd>9 Sep · 8:30 pm IST</dd></div>}</dl><p className="settings-helper">Low activity means fewer than two confirmed-open listings within 150 m of a checked point.</p>{dataMode==='sample'&&selectedAnalysis.limitations.map(text=><p className="settings-helper" key={text}>{text}</p>)}<ScoreBreakdown comparison={comparison} routeId={selectedRoute.id} sample={dataMode==='sample'}/><RoadEvidence analysis={liveResult?.roadAnalyses?.[selectedRoute.id]}/>{dataMode==='live'&&<details className="evidence-footnotes"><summary>Methodology and limitations</summary><p>Counts are distinct observed listings, not a census. Staffed-place categories are a proxy for businesses normally attended by staff; actual staff presence is not measured. The low-activity threshold needs local calibration. The gap estimate comes from samples about 200 m apart and is not a surveyed street measurement.</p><p>Lighting and crime are not measured. Road classification is shown separately when available. Potential help categories do not verify access, staff or assistance.</p>{selectedAnalysis.limitations.map(text=><p key={text}>{text}</p>)}<p>Opening hours are evaluated at an estimated passing time using available schedules. Traffic, access and actual opening can differ. Scores are experimental and uncalibrated. Live ranges describe the available listings and missing evidence. They do not establish actual street conditions.</p></details>}<button className="secondary-button" onClick={() => setModal(null)}>Back to routes</button></Sheet>}
    {modal === 'handoff' && <Sheet title="Continue in Google Maps" onClose={() => setModal(null)}><span className="place-icon large"><Navigation size={26} /></span><p className="evidence-lead">{origin}<br /><span>to {destination}</span></p><p className="selected-handoff">Selected: {selectedRoute?.label} · {selectedRoute ? minutes(selectedRoute) : 0} min {dataMode==='sample'?'':''}</p><p>Google Maps opens with your starting point and destination only — no stops in between. It plans its own current route, which can differ from the option you compared here.</p>{stale&&<p role="status">The comparison is over five minutes old. Check current conditions in Maps.</p>}<p className="settings-helper">Check the starting gate, entrance, stops and route preview before navigating. Opening Google Maps sends the journey locations to Google.</p><a className="primary-button" href={handoffUrl} target="_blank" rel="noreferrer" onClick={e=>{if(Capacitor.isNativePlatform()){e.preventDefault();void openMaps(handoffUrl).catch(()=>setLocationMessage('Could not open Maps. Try again or use a browser.'));}}}>Open Google Maps <ExternalLink size={18} /></a>{locationMessage&&<p role="status">{locationMessage}</p>}<button className="text-button centered" onClick={() => setModal(null)}>Keep comparing</button></Sheet>}
    {modal === 'location' && <Sheet title="Use your current location" onClose={()=>{locationId.current++;setLocating(false);setModal(null);}}><p className="sheet-intro">Use a one-time location reading as the starting pin. This switches to live mode. Your phone may look up an approximate address. Searching sends this starting point for nearby suggestions and travel estimates.</p><p>You can keep using the supplied AEOS pin without granting location permission.</p>{locationMessage&&<p role="status">{locationMessage}</p>}{Capacitor.isNativePlatform()&&<div className="location-recovery"><button className="secondary-button" onClick={()=>void openLocationSettings().catch(()=>setLocationMessage('Open phone Settings and enable Location.'))}>Open location settings</button><button className="text-button" onClick={()=>void openAppSettings().catch(()=>setLocationMessage('Open this app in phone Settings to change its permission.'))}>App permission settings</button></div>}<button className="primary-button" disabled={locating} onClick={()=>void locate()}>{locating?'Locating…':'Get current location'}</button><button className="text-button centered" onClick={()=>{locationId.current++;setLocating(false);setModal('origin');}}>Choose a pin instead</button></Sheet>}
    {modal === 'about' && <Sheet title="About NightWise" onClose={() => setModal(null)}><div className="about-brand"><MoonMark size={40} /><strong>Compare night routes.</strong></div><p>NightWise helps you compare travel time with available activity information along a journey. It does not measure personal safety, lighting or crime risk.</p><Illustration name="activity-explained-v2"/><h3>About this tutorial</h3><p>Tutorial mode walks through AEOS ↔ Manyata Tech Park using a built-in street map. Live mode requests Google routes and, when enabled, nearby listings through our backend. Both AEOS and Manyata pins come from your supplied links. Missing information stays unknown.</p><h3>How comparisons work</h3><p>We sample along each path, count each observed place once and keep unknown sections separate. Extra time is shown alongside evidence. A substantial detour or incomplete data prevents an automatic activity recommendation.</p><h3>Your privacy</h3><p>No account is needed. This build remembers your appearance, extra-time preference and saved-place labels on this device. Google favourites store a place ID and are resolved again when selected. Pins you enter yourself stay locally until removed. It does not track your location continuously, send analytics or run background scans. A one-time location reading is optional. Live comparisons send journey coordinates to our backend and Google. In live search, suggestions are requested after you pause typing. Search text and the opposite journey endpoint are sent to our backend and Google to show place matches and driving estimates. Results stay in memory for the session; only request counts are saved by the backend. OpenStreetMap road data is stored locally; your route is not written to that extract. A Google Maps handoff shares the chosen journey with Google.</p><button className="secondary-button" onClick={() => setModal(null)}>Back to NightWise</button></Sheet>}

  </div>{splash && <LaunchScreen onDone={closeLaunch}/>}</>;
}
