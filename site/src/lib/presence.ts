import { useEffect, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Presence<T> = { current: T | null; state: 'open' | 'closing'; entered: boolean };

/**
 * Keeps the last non-null value mounted for `exitMs` after `value` turns null, so CSS can animate it out.
 * A new value replaces it immediately (switching icons never animates). Under reduced motion it drops at once.
 * `entered` is true only when a value arrived after mount (null to value), so the first paint never animates in.
 */
export function usePresence<T>(value: T | null, exitMs: number): Presence<T> {
  const [shown, setShown] = useState<Presence<T>>({ current: value, state: 'open', entered: false });

  if (value !== null && (shown.current !== value || shown.state !== 'open')) {
    setShown({ current: value, state: 'open', entered: shown.current === null ? true : shown.entered });
  } else if (value === null && shown.current !== null && shown.state === 'open') {
    setShown(reducedMotion() ? { current: null, state: 'open', entered: false } : { ...shown, state: 'closing' });
  }

  useEffect(() => {
    if (shown.state !== 'closing') return;
    const timer = setTimeout(() => setShown({ current: null, state: 'open', entered: false }), exitMs);
    return () => clearTimeout(timer);
  }, [shown.state, exitMs]);

  return shown;
}
