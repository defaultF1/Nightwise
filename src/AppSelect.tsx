import {useEffect,useId,useRef,useState,type ComponentType} from 'react';
import {Check,ChevronDown,type LucideProps} from 'lucide-react';
type Option<T extends string>={value:T;label:string;description?:string;icon?:ComponentType<LucideProps>};
export function closeAppSelect(){return !window.dispatchEvent(new Event('nightwise:close-select',{cancelable:true}));}
export default function AppSelect<T extends string>({label,caption=label,value,options,onChange,icon:Icon,disabled=false}:{label:string;caption?:string;value:T;options:readonly Option<T>[];onChange:(value:T)=>void;icon?:ComponentType<LucideProps>;disabled?:boolean}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(0);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLDivElement>(null),id=useId();
 const selected=Math.max(0,options.findIndex(o=>o.value===value)),current=options[selected],Glyph=current?.icon??Icon;
 function close(focus=false){setOpen(false);if(focus)trigger.current?.focus();}
 function show(){setActive(selected);setOpen(true);}
 function choose(i:number){if(options[i])onChange(options[i].value);close(true);}
 useEffect(()=>{
  if(!open)return;
  list.current?.focus();
  function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))close();}
  function back(e:Event){e.preventDefault();close(true);}
  document.addEventListener('pointerdown',outside);window.addEventListener('nightwise:close-select',back);
  return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('nightwise:close-select',back);};
 },[open]);
 useEffect(()=>{if(open)document.getElementById(`${id}-${active}`)?.scrollIntoView({block:'nearest'});},[open,active,id]);
 return <div className="app-select" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))close();}}>
  <button type="button" ref={trigger} className="app-select-trigger" disabled={disabled||!current} aria-label={`${label}: ${current?.label??'Unavailable'}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?id:undefined}
   onClick={()=>open?close():show()} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();show();}}}>
   {Glyph&&<Glyph size={18} aria-hidden="true"/>}<span className="app-select-value"><small>{caption}</small><strong>{current?.label??'Unavailable'}</strong></span><ChevronDown size={16} aria-hidden="true" className={open?'is-open':''}/>
  </button>
  {open&&<div id={id} ref={list} role="listbox" aria-label={label} tabIndex={-1} aria-activedescendant={`${id}-${active}`} className="app-select-options" onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}
   else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length);}
   else if(e.key==='Home'||e.key==='End'){e.preventDefault();setActive(e.key==='Home'?0:options.length-1);}
   else if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(active);}
  }}>{options.map((o,i)=><div key={o.value} id={`${id}-${i}`} role="option" aria-selected={o.value===value} className={`app-select-option${active===i?' is-active':''}`} onPointerMove={()=>setActive(i)} onClick={()=>choose(i)}>
   {o.icon&&<o.icon size={18} aria-hidden="true"/>}<span><strong>{o.label}</strong>{o.description&&<small>{o.description}</small>}</span>{o.value===value&&<Check size={17} aria-hidden="true"/>}
  </div>)}</div>}
 </div>;
}
