import {useCallback,useEffect,useState} from 'react';
import {availableNavigationApps} from './native';
import type {NavigationApp} from './domain/handoff';
export function useNavigationApps(enabled:boolean){
 const [state,setState]=useState<{status:'loading'|'ready'|'error';native:boolean;apps:{value:NavigationApp;label:string}[]}>({status:'loading',native:false,apps:[]});
 const [revision,setRevision]=useState(0);
 const refresh=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  if(!enabled)return;
  let cancelled=false;
  setState(s=>({...s,status:'loading',apps:[]}));
  void availableNavigationApps().then(result=>{
   if(cancelled)return;
   setState({...result,status:'ready'});
  }).catch(()=>{if(!cancelled)setState(s=>({...s,status:'error',apps:[]}));});
  const visible=()=>{if(document.visibilityState==='visible')refresh();};
  window.addEventListener('nightwise:refresh-navigation-apps',refresh);document.addEventListener('visibilitychange',visible);
  return()=>{cancelled=true;window.removeEventListener('nightwise:refresh-navigation-apps',refresh);document.removeEventListener('visibilitychange',visible);};
 },[enabled,revision,refresh]);
 return {...state,refresh};
}
