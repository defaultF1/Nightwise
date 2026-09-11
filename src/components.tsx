import { useEffect, useRef, type ReactNode } from 'react';
import { X, MapPin } from 'lucide-react';

export function MoonMark({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M29 3a20.6 20.6 0 1 0 15.7 30.8A19 19 0 0 1 29 3Z" /></svg>;
}

export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = old; if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="sheet" aria-labelledby="sheet-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet-inner"><div className="sheet-heading"><h2 id="sheet-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={21} /></button></div>{children}</div>
  </dialog>;
}

export function MapPlaceholder() {
  return <div className="map-placeholder" role="img" aria-label="Bengaluru map placeholder. Live map is not connected in this tutorial.">
    <span className="map-city"><MapPin size={14} /> Bengaluru</span>
    <div className="map-placeholder-message"><MapPin size={27} /><strong>Your journey, in view</strong><span>The live map will appear here.</span><small>Tutorial preview · map not connected</small></div>
    <span className="map-scale">N ↑</span>
  </div>;
}
