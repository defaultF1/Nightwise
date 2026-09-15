import {expect,test} from 'vitest';
import {placePinKind,placePins,pinTint,visiblePlacePins,pinsNearRoute,type PlacePin} from '../../src/maps/pins';
import type {ActivityAnalysis} from '../../src/domain/activity-types';

test('route switching removes parallel-street pins without snapping their factual positions',()=>{
 const a=[{latitude:13.05,longitude:77.60},{latitude:13.06,longitude:77.60}];
 const b=a.map(p=>({...p,longitude:77.6015}));
 const pins:PlacePin[]=[{name:'On A',kind:'shop',latitude:13.055,longitude:77.6002},{name:'On B',kind:'fuel',latitude:13.055,longitude:77.6016}];
 expect(pinsNearRoute(pins,a)).toEqual([pins[0]]);
 expect(pinsNearRoute(pins,b)).toEqual([pins[1]]);
 expect(pinsNearRoute(pins,[])).toEqual([]);
 expect(pinsNearRoute(pins,[...a].reverse())[0]).toBe(pins[0]);
});

test('off-route listings cannot consume the visible pin allowance',()=>{
 const path=[{latitude:13.05,longitude:77.60},{latitude:13.06,longitude:77.60}];
 const places=Array.from({length:70},(_,i)=>({id:String(i),name:String(i),categories:['store'],coordinate:{latitude:13.055,longitude:i<60?77.601:77.6001},hours:{state:'open'},conflict:false}));
 const analysis={places} as unknown as ActivityAnalysis;
 expect(visiblePlacePins(analysis,10,false,path)).toHaveLength(10);
 expect(visiblePlacePins(analysis,10,false,path).every(p=>p.longitude===77.6001)).toBe(true);
 expect(analysis.places).toHaveLength(70);
});
test('medical and fuel categories take precedence over a generic store',()=>{
 expect(placePinKind(['store','pharmacy'])).toBe('medical');
 expect(placePinKind(['store','pharmacy','hospital'])).toBe('hospital');
 expect(placePinKind(['store','gas_station'])).toBe('fuel');
 expect(placePinKind(['restaurant'])).toBe('shop');
 expect(placePinKind(['train_station'])).toBeUndefined();
 expect(pinTint('start').b).toBeGreaterThan(pinTint('start').r);
 expect(pinTint('destination').r).toBeGreaterThan(pinTint('destination').b);
 expect(pinTint('fuel').g).toBeGreaterThan(pinTint('fuel').r);
});
test('business pins exclude closed unknown conflicted and unlocated observations',()=>{
 const base={id:'place',categories:['pharmacy'],coordinate:{latitude:13.06,longitude:77.59},hours:{state:'open'},conflict:false};
 const analysis={places:[base,{...base,id:'closed',hours:{state:'closed'}},{...base,id:'unknown',hours:{state:'unknown'}},{...base,id:'conflict',conflict:true},{...base,id:'unlocated',coordinate:undefined}]} as unknown as ActivityAnalysis;
 expect(placePins(analysis)).toEqual([{latitude:13.06,longitude:77.59,name:'Medical listing',kind:'medical'}]);
 expect(placePins()).toEqual([]);
});
test('visible pins cap dense live results while retaining medical and fuel evidence',()=>{
 const places=Array.from({length:90},(_,id)=>({id:String(id),categories:[id<20?'pharmacy':id<35?'gas_station':'store'],coordinate:{latitude:13.05+id/10000,longitude:77.59},hours:{state:'open'},conflict:false}));
 const pins=visiblePlacePins({places} as unknown as ActivityAnalysis);
 expect(pins).toHaveLength(24);
 expect(pins.filter(pin=>pin.kind==='medical')).toHaveLength(6);
 expect(pins.filter(pin=>pin.kind==='fuel')).toHaveLength(6);
 expect(pins.filter(pin=>pin.kind==='shop')).toHaveLength(12);
 expect(visiblePlacePins({places} as unknown as ActivityAnalysis,1)).toHaveLength(1);
 expect(visiblePlacePins({places} as unknown as ActivityAnalysis,0)).toHaveLength(0);
});

test('all listings mode shows known locations without implying unknown or closed shops are open',()=>{
 const base={id:'shop',categories:['store'],coordinate:{latitude:13.06,longitude:77.59},hours:{state:'unknown'},conflict:false};
 const analysis={places:[base,{...base,id:'hospital',categories:['hospital'],hours:{state:'closed'}},{...base,id:'fuel',categories:['gas_station'],hours:{state:'open'}},{...base,id:'conflict',conflict:true}]} as unknown as ActivityAnalysis;
 const pins=visiblePlacePins(analysis,60,true);
 expect(pins.map(p=>p.status)).toEqual(['Opening hours unknown','Listed closed around arrival','Listed open around arrival']);
 expect(pins.map(p=>p.kind)).toEqual(['shop','hospital','fuel']);
 expect(visiblePlacePins(analysis,60,false)).toHaveLength(1);
});
