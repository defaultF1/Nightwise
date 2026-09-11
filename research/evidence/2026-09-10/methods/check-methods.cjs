const fs=require('fs'),assert=require('assert/strict');
const dir='research/evidence/2026-09-10';
// Geometry-only validation: no Google data, invented places or route recommendations.
const r=150,child=r/Math.sqrt(2),centers=[[-75,-75],[-75,75],[75,-75],[75,75]];
let diskPoints=0,uncovered=0;
for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){if(x*x+y*y>r*r)continue;diskPoints++;if(!centers.some(([a,b])=>Math.hypot(x-a,y-b)<=child+1e-9))uncovered++;}
assert.equal(uncovered,0);
function gap(states,unknownLow){let longest=0,current=0;for(const s of states){current=s==='low'||s==='unknown'&&unknownLow?current+200:0;longest=Math.max(longest,current);}return longest;}
const states=['low','unknown','low','active','unknown'];const gapInterval=[gap(states,false),gap(states,true)];assert.deepEqual(gapInterval,[200,600]);
const weights=[25,20,15,15,15,10];
function score(v){return [0,1].map(i=>v.reduce((s,x,k)=>s+weights[k]*x[i],0));}
const a=score([[.8,.9],[.8,.9],[.7,.9],[.7,.9],[.8,.8],[.6,.8]]);
const b=score([[.4,.6],[.5,.6],[.4,.6],[.4,.6],[.7,.7],[.3,.5]]);
const c=score([[.3,1],[.3,1],[0,1],[0,1],[.7,.7],[0,1]]);
assert(a[0]>b[1]);assert(!(a[0]>c[1]));assert(c[0]<a[1]);
const results={scanGeometry:{radiusMetres:r,spacingMetres:200,continuousCorridorHalfWidthMetres:Math.sqrt(r*r-100*100),shrunkRadius75AtSpacing200GapMetres:50,coveringChildren:centers.map(([x,y])=>({x,y,radiusMetres:child})),integerGridPointsChecked:diskPoints,uncovered,limitations:'Analytical coverage of query footprint only; no evidence of Google result completeness or request yield. One refinement requires four extra calls and parent-footprint filtering.'},gapBoundExample:{states,segmentMetres:200,longestLowGapBoundsMetres:gapInterval,basis:'Synthetic states; bounds relative to assessment categories, not all real-world activity.'},scoreIntervalExamples:{weights,a,b,c,aRobustlyExceedsB:a[0]>b[1],aRobustlyExceedsC:a[0]>c[1],interpretation:'Synthetic arithmetic check only. Bounds are assumption ranges, not statistical confidence or calibrated live scores. Unknown weighted component remains [0,1].'},status:'Research prototypes only; application unchanged'};
fs.writeFileSync(dir+'/method-experiments.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
