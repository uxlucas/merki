// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchStars, formatStars, useStars } from './stars';

const reply = (status: number, body: unknown) =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response);

afterEach(() => window.sessionStorage.clear());

describe('formatStars', () => {
  it('shortens thousands', () => {
    expect(formatStars(7)).toBe('7');
    expect(formatStars(999)).toBe('999');
    expect(formatStars(1000)).toBe('1k');
    expect(formatStars(1234)).toBe('1.2k');
    expect(formatStars(25_600)).toBe('25.6k');
  });
});

describe('fetchStars', () => {
  it('reads stargazers_count from the repo endpoint', async () => {
    const f = reply(200, { stargazers_count: 128 });
    expect(await fetchStars('uxlucas/merki', f)).toBe(128);
    expect(f).toHaveBeenCalledWith('https://api.github.com/repos/uxlucas/merki', expect.objectContaining({ headers: { Accept: 'application/vnd.github+json' } }));
  });

  it('gives null when GitHub says no or the reply is odd', async () => {
    expect(await fetchStars('uxlucas/merki', reply(404, { message: 'Not Found' }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', reply(403, { message: 'rate limited' }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', reply(200, { stargazers_count: 'lots' }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', reply(200, { stargazers_count: -1 }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', vi.fn(async () => { throw new Error('offline'); }))).toBeNull();
  });
});

describe('useStars', () => {
  it('starts empty, then shows the count and caches it for the session', async () => {
    const f = reply(200, { stargazers_count: 42 });
    const { result } = renderHook(() => useStars('uxlucas/merki', f));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(42));
    const again = reply(200, { stargazers_count: 99 });
    const second = renderHook(() => useStars('uxlucas/merki', again));
    await waitFor(() => expect(second.result.current).toBe(42));
    expect(again).not.toHaveBeenCalled();
  });

  it('stays empty when the fetch fails', async () => {
    const { result } = renderHook(() => useStars('uxlucas/merki', reply(404, {})));
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current).toBeNull();
  });
});
