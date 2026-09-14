import { useLayoutEffect, useRef, useState } from 'react';

// App Back has a single owner. Consume its action before it closes the journey sheet.
export function closeExpandedMap(): boolean {
  if (!document.querySelector('.map-expanded')) return false;
  window.dispatchEvent(new Event('nightwise-minimize-map'));
  return true;
}

export function useExpandedMap() {
  const [expanded, setExpanded] = useState(false);
  const container = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!expanded || !container.current) return;
    const map = container.current;
    const ancestors: HTMLElement[] = [];
    const siblings: { element: HTMLElement; inert: boolean }[] = [];
    const scrolls: { element: HTMLElement; top: number; left: number }[] = [];
    // Expand the SAME map element: no remount, second map instance or API request.
    for (let branch: HTMLElement = map; branch.parentElement; branch = branch.parentElement) {
      const parent = branch.parentElement;
      scrolls.push({ element: parent, top: parent.scrollTop, left: parent.scrollLeft });
      parent.classList.add('map-expanded-ancestor'); ancestors.push(parent);
      for (const sibling of parent.children) if (sibling !== branch && sibling instanceof HTMLElement) {
        siblings.push({ element: sibling, inert: sibling.inert });
        sibling.inert = true; sibling.classList.add('map-expanded-away');
      }
    }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const minimize = () => setExpanded(false);
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); minimize();
      } else if (event.key === 'Tab') {
        const focusable = [...map.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')]
          .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && (document.activeElement === first || !map.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !map.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    window.addEventListener('nightwise-minimize-map', minimize);
    document.addEventListener('keydown', key, true);
    toggle.current?.focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
    return () => {
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('nightwise-minimize-map', minimize);
      siblings.forEach(({ element, inert }) => { element.inert = inert; element.classList.remove('map-expanded-away'); });
      ancestors.forEach(el => el.classList.remove('map-expanded-ancestor'));
      document.body.style.overflow = oldOverflow;
      scrolls.forEach(({ element, top, left }) => { element.scrollTop = top; element.scrollLeft = left; });
      toggle.current?.focus({ preventScroll: true });
      window.dispatchEvent(new Event('resize'));
    };
  }, [expanded]);
  return { expanded, setExpanded, container, toggle };
}
