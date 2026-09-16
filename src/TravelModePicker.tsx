import {Bike,CarFront,Footprints} from 'lucide-react';
import type {LiveJourney} from './domain/journey';
const options=[{value:'DRIVE',label:'Car',icon:CarFront},{value:'TWO_WHEELER',label:'Bike',icon:Bike},{value:'WALK',label:'Walk',icon:Footprints}] as const;
export default function TravelModePicker({value,onChange}:{value:LiveJourney['mode'];onChange:(mode:LiveJourney['mode'])=>void}){
 return <div className="mode-picker" role="group" aria-label="Travel mode">
  <small>Travel by</small>
  <div className="mode-picker-options">{options.map(o=><button key={o.value} type="button" aria-pressed={value===o.value} aria-label={o.label} title={o.label} onClick={()=>onChange(o.value)}><o.icon size={20} aria-hidden="true"/></button>)}</div>
 </div>;
}
