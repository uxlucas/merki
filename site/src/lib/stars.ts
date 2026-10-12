import { useEffect, useState } from 'react';
import { safeSessionGet, safeSessionSet } from './storage';

const CACHE_KEY = 'merki-stars';

export function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = Math.round(n / 100) / 10;
  return `${Number.isInteger(k) ? k.toFixed(0) : k}k`;
}

/** The repo's star count, or null when GitHub won't say (private, rate-limited, offline, odd reply). */
export async function fetchStars(repo: string, fetchImpl: typeof fetch = globalThis.fetch): Promise<number | null> {
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const count = (await res.json() as { stargazers_count?: unknown }).stargazers_count;
    return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : null;
  } catch {
    return null;
  }
}

/** Null on the server and on first render (no hydration mismatch); fills in after the fetch. */
export function useStars(repo: string, fetchImpl?: typeof fetch): number | null {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    const cached = Number(safeSessionGet(CACHE_KEY));
    if (safeSessionGet(CACHE_KEY) !== null && Number.isInteger(cached) && cached >= 0) {
      setStars(cached);
      return;
    }
    let live = true;
    void fetchStars(repo, fetchImpl).then((count) => {
      if (!live || count === null) return;
      safeSessionSet(CACHE_KEY, String(count));
      setStars(count);
    });
    return () => {
      live = false;
    };
  }, [repo, fetchImpl]);
  return stars;
}
