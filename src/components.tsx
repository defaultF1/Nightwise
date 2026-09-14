import { useEffect, useRef, type ReactNode } from 'react';
import { X, MapPin } from 'lucide-react';

export function MoonMark({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M29 3a20.6 20.6 0 1 0 15.7 30.8A19 19 0 0 1 29 3Z" /></svg>;
}

// A plain fixed overlay, not the native <dialog> top layer: Android WebView
// stops repainting top-layer content below the fold once the keyboard resizes
// the viewport, leaving sheets black while typing. The normal compositing
// path repaints correctly and keeps the same role, backdrop and behaviour.
export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus({ preventScroll: true });
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = old; if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" className="sheet" aria-labelledby="sheet-title">
      <div className="sheet-inner"><div className="sheet-heading"><h2 id="sheet-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={21} /></button></div><div className="sheet-body" onSubmitCapture={()=>{if(document.activeElement instanceof HTMLInputElement)document.activeElement.blur();}}>{children}</div></div>
    </div>
  </div>;
}

export function MapPlaceholder() {
  return <div className="map-placeholder" role="img" aria-label="Bengaluru map placeholder. Live map is not connected in this tutorial.">
    <span className="map-city"><MapPin size={14} /> Bengaluru</span>
    <div className="map-placeholder-message"><MapPin size={27} /><strong>Your journey, in view</strong><span>The live map will appear here.</span><small>Tutorial preview · map not connected</small></div>
    <span className="map-scale">N ↑</span>
  </div>;
}
