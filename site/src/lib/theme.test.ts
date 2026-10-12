// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeGet, safeSet } from './storage';
import { THEME_KEY, parseTheme, resolveTheme, toggleTheme, watchSystemTheme } from './theme';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('theme', () => {
  it('prefers the stored choice, then the system', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('ignores stored junk', () => {
    expect(parseTheme('blue')).toBeNull();
    expect(parseTheme(null)).toBeNull();
    expect(parseTheme('dark')).toBe('dark');
  });

  it('toggles the page theme and remembers it', () => {
    document.documentElement.dataset.theme = 'light';
    expect(toggleTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('still toggles when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    document.documentElement.dataset.theme = 'dark';
    expect(toggleTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(safeGet(THEME_KEY)).toBeNull();
    expect(() => safeSet(THEME_KEY, 'dark')).not.toThrow();
  });

  it('pauses transitions while the theme flips', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    document.documentElement.dataset.theme = 'light';
    toggleTheme();
    expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
    frames.shift()!(0);
    frames.shift()!(0);
    expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('pauses transitions when the system theme changes and nothing is stored', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const listeners: Array<() => void> = [];
    const query = { matches: true, addEventListener: (_: string, cb: () => void) => listeners.push(cb), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', () => query);
    document.documentElement.dataset.theme = 'light';
    const stop = watchSystemTheme();
    listeners[0]();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
    frames.shift()!(0);
    frames.shift()!(0);
    expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
    stop();
    expect(query.removeEventListener).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('ignores system changes once a theme is stored', () => {
    const listeners: Array<() => void> = [];
    const query = { matches: true, addEventListener: (_: string, cb: () => void) => listeners.push(cb), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', () => query);
    window.localStorage.setItem(THEME_KEY, 'light');
    document.documentElement.dataset.theme = 'light';
    watchSystemTheme();
    listeners[0]();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('uses the same key as the bootstrap script in index.html', () => {
    const html = readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf8');
    expect(html).toContain(`localStorage.getItem('${THEME_KEY}')`);
  });
});
