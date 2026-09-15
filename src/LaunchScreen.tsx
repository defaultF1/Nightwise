import { useEffect, useRef, useState } from 'react';
import { MapPin, Play } from 'lucide-react';
import { MoonMark } from './components';

type Playback = 'loading' | 'playing' | 'blocked' | 'unavailable';

export function LaunchScreen({ onDone }: { onDone: () => void }) {
  const screen = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const lastProgress = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);
  const [playback, setPlayback] = useState<Playback>('loading');

  function clearDeadline() { clearTimeout(timeout.current); }
  function deadline(ms: number) { clearDeadline(); timeout.current = setTimeout(onDone, ms); }
  function progress() {
    const time = video.current?.currentTime ?? 0;
    if (time > lastProgress.current) {
      lastProgress.current = time;
      // Only stalled playback times out. A progressing video can finish in full.
      deadline(12000);
    }
  }
  function unavailable() {
    if (!mounted.current) return;
    setPlayback('unavailable');
    deadline(2000);
  }
  function play() {
    const element = video.current;
    if (!element) return;
    element.muted = true;
    element.defaultMuted = true;
    setPlayback('loading');
    deadline(10000);
    void element.play().catch((error: unknown) => {
      if (!mounted.current || (error instanceof DOMException && error.name === 'AbortError')) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        clearDeadline();
        setPlayback('blocked');
      } else unavailable();
    });
  }

  useEffect(() => {
    mounted.current = true;
    screen.current?.focus();
    play();
    return () => { mounted.current = false; clearDeadline(); };
  }, []);

  return <div ref={screen} className="launch-screen" role="dialog" aria-modal="true" aria-label="NightWise launch" tabIndex={-1} data-playback={playback}>
    <video ref={video} muted playsInline preload="auto" poster="/assets/launch/nightwise-launch-poster.png" aria-hidden="true"
      onPlaying={() => { setPlayback('playing'); deadline(12000); }} onTimeUpdate={progress} onEnded={onDone} onError={unavailable}
      src="/assets/launch/nightwise-launch-navy-concept.mp4" />
    <div className="launch-brand"><MoonMark size={62} /><strong>NightWise</strong><span>Compare night routes</span><small><MapPin size={13} /> Bengaluru</small></div>
    <div className="launch-actions">
      {playback === 'blocked' && <button className="launch-play" autoFocus onClick={play}><Play size={18} /> Play intro</button>}
      {playback === 'unavailable' && <span role="status">Opening NightWise…</span>}
    </div>
  </div>;
}
