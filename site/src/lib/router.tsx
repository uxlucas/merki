import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { normalizePath } from './routes';

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

interface RouterValue {
  path: string;
  hash: string;
  /** Bumps on every navigation, so effects can react to "same path, new hash". */
  key: number;
  navigate: (to: string, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function split(to: string): { path: string; hash: string } {
  const i = to.indexOf('#');
  if (i === -1) return { path: normalizePath(to), hash: '' };
  return { path: normalizePath(to.slice(0, i) || '/'), hash: to.slice(i + 1) };
}

export function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView?.({ block: 'start' });
}

export function RouterProvider({ initialPath, children }: { initialPath: string; children: ReactNode }) {
  const [location, setLocation] = useState(() => ({ ...split(initialPath), key: 0 }));

  useEffect(() => {
    const onPop = () =>
      setLocation((prev) => ({
        path: normalizePath(window.location.pathname),
        hash: window.location.hash.slice(1),
        key: prev.key + 1,
      }));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    const next = split(to);
    const url = next.hash ? `${next.path}#${next.hash}` : next.path;
    if (options.replace) window.history.replaceState(options.state ?? null, '', url);
    else window.history.pushState(options.state ?? null, '', url);
    setLocation((prev) => ({ ...next, key: prev.key + 1 }));
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter needs a RouterProvider');
  return value;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; onNavigate?: () => void };

export function Link({ to, onNavigate, onClick, ...rest }: LinkProps) {
  const { path, navigate } = useRouter();
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // New tabs and downloads belong to the browser.
    if ((rest.target && rest.target !== '_self') || rest.download !== undefined) return;
    event.preventDefault();
    onNavigate?.();
    const next = split(to);
    if (next.path === path && next.hash) {
      window.history.replaceState(window.history.state, '', `${next.path}#${next.hash}`);
      scrollToId(next.hash);
      return;
    }
    if (next.path === path) {
      // Same page, no hash: no duplicate history entry, just back to the top.
      if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
      return;
    }
    navigate(to);
  };
  return <a href={to} {...rest} onClick={handle} />;
}
