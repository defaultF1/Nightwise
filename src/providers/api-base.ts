import {Capacitor} from '@capacitor/core';
import {usesGeoapify} from './selection';
export function resolveApiBase(geo:boolean,native:boolean,origin:string,webBase='',nativeBase=''){
 const configured=(native?nativeBase||webBase:webBase).replace(/\/$/,'');
 if(configured)return configured;
 if(native){
  if(geo)throw new Error('This app build needs a hosted API URL.');
  return 'https://nightwise-f5fu.onrender.com';
 }
 if(!geo&&['localhost','127.0.0.1'].includes(new URL(origin).hostname))return 'http://127.0.0.1:8787';
 return '';
}
export function apiBase(){return resolveApiBase(usesGeoapify,Capacitor.isNativePlatform(),location.origin,import.meta.env.VITE_API_BASE_URL,import.meta.env.VITE_ANDROID_API_BASE_URL);}
