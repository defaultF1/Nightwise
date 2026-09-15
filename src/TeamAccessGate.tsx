import {useEffect,useState,type ReactNode} from 'react';
import {apiBase} from './providers/api-base';
import {saveTeamAccess,teamAccessHeaders} from './team-access';
export function TeamAccessGate({initialCode,children}:{initialCode:string;children:(code:string)=>ReactNode}){
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(true),[code,setCode]=useState(initialCode),[message,setMessage]=useState('Connecting to Nightwise…');
 async function unlock(value:string,signal?:AbortSignal){
  const r=await fetch(apiBase()+'/api/access',{method:'POST',headers:{'X-Nightwise-Code':value},cache:'no-store',signal:signal??AbortSignal.timeout(65000)});
  if(!r.ok)throw new Error(r.status===401?'That code was not accepted. Check it with your team.':'The live service is unavailable. Please try again.');
 }
 useEffect(()=>{
  const controller=new AbortController();
  void (async()=>{try{
   const r=await fetch(apiBase()+'/api/status',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)]),cache:'no-store'});
   if(!r.ok)throw new Error('The service is starting. Please try again shortly.');
   const status=await r.json();
   if(!status.ready)throw new Error('The live service needs attention. Please contact your team administrator.');
   if(status.accessCodeRequired){if(!initialCode){setMessage('Enter your team code once to use live maps and routes.');return;}await unlock(teamAccessHeaders()['X-Nightwise-Code']||initialCode,controller.signal);}
   if(!controller.signal.aborted)setReady(true);
  }catch(e){if(!controller.signal.aborted)setMessage(e instanceof Error?e.message:'Could not connect. Please try again.');}finally{if(!controller.signal.aborted)setBusy(false);}})();
  return()=>controller.abort();
 },[initialCode]);
 if(ready)return children(teamAccessHeaders()['X-Nightwise-Code']||initialCode);
 return <main className="app-shell"><section className="journey-card" style={{margin:'48px auto',maxWidth:440,padding:24}}><h1>Welcome to Nightwise</h1><p role="status">{message}</p><form onSubmit={e=>{e.preventDefault();setBusy(true);void unlock(code).then(async()=>{await saveTeamAccess(code);setReady(true);}).catch(e=>setMessage(e instanceof Error?e.message:'Could not connect. Please try again.')).finally(()=>setBusy(false));}}><label htmlFor="team-entry">Team access code</label><input id="team-entry" type="password" value={code} maxLength={120} autoComplete="off" onChange={e=>setCode(e.target.value)} style={{width:'100%',margin:'10px 0 20px'}}/><button className="primary-button" disabled={busy||!code.trim()}>{busy?'Connecting…':'Open Nightwise'}</button></form><p className="settings-helper">Saved on this device. Get the code from your team administrator.</p></section></main>;
}
