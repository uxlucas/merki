import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { safeGet, safeSet } from './storage';

export type Size = 16 | 20 | 24;
export const SIZE_KEY = 'merki-size';
export const parseSize = (value: string | null): Size => (value === '20' ? 20 : value === '24' ? 24 : 16);

interface Prefs {
  size: Size;
  setSize: (size: Size) => void;
}

const PrefsContext = createContext<Prefs>({ size: 16, setSize: () => {} });

export function PrefsProvider({ children }: { children: ReactNode }) {
  // Starts at the default on the server and on the first client render, then loads the stored value.
  const [size, setSizeState] = useState<Size>(16);
  useEffect(() => setSizeState(parseSize(safeGet(SIZE_KEY))), []);
  const setSize = useCallback((next: Size) => {
    setSizeState(next);
    safeSet(SIZE_KEY, String(next));
  }, []);
  const value = useMemo(() => ({ size, setSize }), [size, setSize]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = (): Prefs => useContext(PrefsContext);
