import { safeGet, safeSet } from './storage';

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'merki-theme';

export const parseTheme = (value: string | null): Theme | null => (value === 'light' || value === 'dark' ? value : null);
export const resolveTheme = (pref: Theme | null, systemDark: boolean): Theme => pref ?? (systemDark ? 'dark' : 'light');

export function currentTheme(root: HTMLElement = document.documentElement): Theme {
  return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
}

export function toggleTheme(root: HTMLElement = document.documentElement): Theme {
  const next: Theme = currentTheme(root) === 'dark' ? 'light' : 'dark';
  root.classList.add('theme-switching');
  applyTheme(next, root);
  safeSet(THEME_KEY, next);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  return next;
}

/** Follow the system while the visitor hasn't picked a theme. Returns the unsubscribe. */
export function watchSystemTheme(): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (parseTheme(safeGet(THEME_KEY)) === null) applyTheme(resolveTheme(null, query.matches));
  };
  query.addEventListener?.('change', onChange);
  return () => query.removeEventListener?.('change', onChange);
}
