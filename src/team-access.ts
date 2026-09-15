import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const key='nightwise.team-access.v1';
const device=registerPlugin<{installationStamp():Promise<{stamp:string}>}>('DeviceSettings');
let stamp:string|null=null;
let pending=Promise.resolve();
let currentCode='';
export const teamAccessHeaders=():Record<string,string>=>currentCode?{'X-Nightwise-Code':currentCode}:{};

export async function loadTeamAccess():Promise<string>{
  try {
    stamp=Capacitor.isNativePlatform()?(await device.installationStamp()).stamp:'browser-v1';
    const {value}=await Preferences.get({key});
    if(!value)return '';
    const saved=JSON.parse(value);
    if(saved.stamp===stamp&&typeof saved.code==='string'&&saved.code.length<=120)return currentCode=saved.code;
    await Preferences.remove({key});
  } catch { /* Storage failure leaves normal manual entry available. */ }
  return '';
}

export function saveTeamAccess(code:string):Promise<void>{
  currentCode=code;
  if(!stamp)return Promise.resolve();
  const value=JSON.stringify({stamp,code});
  pending=pending.catch(()=>{}).then(()=>code?Preferences.set({key,value}):Preferences.remove({key}));
  return pending;
}
