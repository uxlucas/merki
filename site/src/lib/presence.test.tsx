// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePresence } from './presence';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('usePresence', () => {
  it('keeps the last value while it animates out, then drops it', () => {
    const { result, rerender } = renderHook(({ v }) => usePresence(v, 180), { initialProps: { v: 'calendar' as string | null } });
    expect(result.current).toEqual({ current: 'calendar', state: 'open' });
    rerender({ v: null });
    expect(result.current).toEqual({ current: 'calendar', state: 'closing' });
    act(() => vi.advanceTimersByTime(179));
    expect(result.current.current).toBe('calendar');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toEqual({ current: null, state: 'open' });
  });

  it('follows a new value at once and cancels a pending exit', () => {
    const { result, rerender } = renderHook(({ v }) => usePresence(v, 180), { initialProps: { v: 'calendar' as string | null } });
    rerender({ v: null });
    rerender({ v: 'bell' });
    expect(result.current).toEqual({ current: 'bell', state: 'open' });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toEqual({ current: 'bell', state: 'open' });
  });

  it('drops at once under reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const { result, rerender } = renderHook(({ v }) => usePresence(v, 180), { initialProps: { v: 'calendar' as string | null } });
    rerender({ v: null });
    expect(result.current).toEqual({ current: null, state: 'open' });
    // @ts-expect-error cleanup of the stub
    delete window.matchMedia;
  });
});
