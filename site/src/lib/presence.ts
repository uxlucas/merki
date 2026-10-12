import { useEffect, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps the last non-null value mounted for `exitMs` after `value` turns null, so CSS can animate it out.
 * A new value replaces it immediately (switching icons never animates). Under reduced motion it drops at once.
 */
export function usePresence<T>(value: T | null, exitMs: number): { current: T | null; state: 'open' | 'closing' } {
  const [shown, setShown] = useState<{ current: T | null; state: 'open' | 'closing' }>({ current: value, state: 'open' });

  if (value !== null && (shown.current !== value || shown.state !== 'open')) {
    setShown({ current: value, state: 'open' });
  } else if (value === null && shown.current !== null && shown.state === 'open') {
    setShown(reducedMotion() ? { current: null, state: 'open' } : { current: shown.current, state: 'closing' });
  }

  useEffect(() => {
    if (shown.state !== 'closing') return;
    const timer = setTimeout(() => setShown({ current: null, state: 'open' }), exitMs);
    return () => clearTimeout(timer);
  }, [shown.state, exitMs]);

  return shown;
}
