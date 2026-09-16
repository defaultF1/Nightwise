import { useEffect, useId, useRef, useState } from 'react';
import { Bike, CarFront, Check, ChevronDown, Footprints } from 'lucide-react';
import type { LiveJourney } from './domain/journey';

const options = [
  { value: 'DRIVE', label: 'Car', description: 'Driving routes', icon: CarFront },
  { value: 'TWO_WHEELER', label: 'Bike', description: 'Motorbike routes', icon: Bike },
  { value: 'WALK', label: 'Walk', description: 'Walking routes', icon: Footprints },
] as const;

export function closeTravelModePicker() {
  return !window.dispatchEvent(new Event('nightwise:close-travel-mode', { cancelable: true }));
}

export default function TravelModePicker({ value, onChange }: { value: LiveJourney['mode']; onChange: (mode: LiveJourney['mode']) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.findIndex(o => o.value === value);
  const current = options[selected];
  const Icon = current.icon;
  function show(index = selected) { setActive(index); setOpen(true); }
  function close(restoreFocus = false) { setOpen(false); if (restoreFocus) trigger.current?.focus(); }
  function choose(index: number) { onChange(options[index].value); close(true); }
  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    function outside(e: PointerEvent) { if (!root.current?.contains(e.target as Node)) setOpen(false); }
    function back(e: Event) { e.preventDefault(); setOpen(false); trigger.current?.focus(); }
    document.addEventListener('pointerdown', outside);
    window.addEventListener('nightwise:close-travel-mode', back);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('nightwise:close-travel-mode', back); };
  }, [open]);
  return <div className="travel-mode-picker" ref={root} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) close(); }}>
    <button ref={trigger} type="button" className="travel-mode-trigger" aria-label={`Travel mode: ${current.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => open ? close() : show()} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); show(); } }}>
      <Icon size={20} aria-hidden="true"/><span><small>Travel by</small><strong>{current.label}</strong></span><ChevronDown size={16} className={open ? 'is-open' : ''} aria-hidden="true"/>
    </button>
    {open && <div ref={list} id={id} className="travel-mode-options" role="listbox" aria-label="Travel mode" tabIndex={-1} aria-activedescendant={`${id}-${active}`}
      onKeyDown={e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length); }
        else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setActive(e.key === 'Home' ? 0 : options.length - 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
      }}>
      {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value === value}
        className={`travel-mode-option ${index === active ? 'is-active' : ''}`} onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
        <option.icon size={21} aria-hidden="true"/><span><strong>{option.label}</strong><small>{option.description}</small></span>{option.value === value && <Check size={18} aria-hidden="true"/>}
      </div>)}
    </div>}
  </div>;
}
