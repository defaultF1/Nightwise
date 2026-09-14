export function Illustration({ name, compact = false }: { name: 'route-unavailable' | 'connection-retry' | 'evidence-unknown' | 'activity-explained-v2'; compact?: boolean }) {
  return <img className={`state-illustration${compact?' compact':''}`} src={`/assets/illustrations/${name}.png`} width="1344" height="752" alt="" aria-hidden="true" decoding="async" />;
}
