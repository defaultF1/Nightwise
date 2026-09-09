// Capacitor listens to window scrolling, but nested overflow elements do not bubble
// scroll events. Forward ancestor scrolls without recreating or re-querying the map.
export function syncNestedMapScroll(element: HTMLElement, viewport: Window = window) {
  const ancestors: HTMLElement[] = [];
  let frame: number | undefined;
  const notify = () => {
    if (frame !== undefined) return;
    frame = viewport.requestAnimationFrame(() => {
      frame = undefined;
      viewport.dispatchEvent(new Event('scroll'));
    });
  };
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    ancestors.push(parent);
    parent.addEventListener('scroll', notify, { passive: true });
  }
  return () => {
    ancestors.forEach(parent => parent.removeEventListener('scroll', notify));
    if (frame !== undefined) viewport.cancelAnimationFrame(frame);
  };
}
