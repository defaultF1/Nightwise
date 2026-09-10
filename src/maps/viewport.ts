export type Rect={left:number;top:number;right:number;bottom:number};
export function intersectRects(rects:Rect[]):Rect{
  const left=Math.max(...rects.map(r=>r.left)),top=Math.max(...rects.map(r=>r.top));
  return {left,top,right:Math.max(left,Math.min(...rects.map(r=>r.right))),bottom:Math.max(top,Math.min(...rects.map(r=>r.bottom)))};
}
export function syncMapViewport(element:HTMLElement,update:(rect:Rect)=>Promise<void>){
  let frame:number|undefined,stopped=false,last='';
  function measure(){
    frame=undefined;if(stopped)return;
    const viewport=window.visualViewport;
    const rects:Rect[]=[element.getBoundingClientRect(),{left:viewport?.offsetLeft??0,top:viewport?.offsetTop??0,right:(viewport?.offsetLeft??0)+(viewport?.width??innerWidth),bottom:(viewport?.offsetTop??0)+(viewport?.height??innerHeight)}];
    let hidden=false;
    for(let p:HTMLElement|null=element;p;p=p.parentElement){const style=getComputedStyle(p);if(style.display==='none'||style.visibility==='hidden')hidden=true;if(p!==element&&/(auto|scroll|hidden|clip)/.test(style.overflow+style.overflowX+style.overflowY))rects.push(p.getBoundingClientRect());}
    const dialogs=[...document.querySelectorAll('[role="dialog"]')];
    if(dialogs.length&&!dialogs.at(-1)!.contains(element))hidden=true;
    const rect=hidden?{left:0,top:0,right:0,bottom:0}:intersectRects(rects);
    const key=JSON.stringify(rect);if(key!==last){last=key;void update(rect).catch(()=>{last='';});}
  }
  const notify=()=>{if(frame===undefined)frame=requestAnimationFrame(measure);};
  window.addEventListener('scroll',notify,true);window.addEventListener('resize',notify);window.visualViewport?.addEventListener('resize',notify);
  const resize=new ResizeObserver(notify);resize.observe(element);
  const mutation=new MutationObserver(notify);mutation.observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['class','style','open']});
  notify();
  return ()=>{stopped=true;if(frame!==undefined)cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();window.removeEventListener('scroll',notify,true);window.removeEventListener('resize',notify);window.visualViewport?.removeEventListener('resize',notify);};
}
