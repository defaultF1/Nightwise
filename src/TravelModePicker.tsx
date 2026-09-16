import {Bike,CarFront,Footprints} from 'lucide-react';
import type {LiveJourney} from './domain/journey';
import AppSelect from './AppSelect';
const options=[{value:'DRIVE',label:'Car',description:'Driving routes',icon:CarFront},{value:'TWO_WHEELER',label:'Bike',description:'Motorbike routes',icon:Bike},{value:'WALK',label:'Walk',description:'Walking routes',icon:Footprints}] as const;
export default function TravelModePicker({value,onChange}:{value:LiveJourney['mode'];onChange:(mode:LiveJourney['mode'])=>void}){
 return <AppSelect label="Travel mode" caption="Travel by" value={value} options={options} onChange={onChange}/>;
}
