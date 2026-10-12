// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrefsProvider, SIZE_KEY, parseSize, usePrefs } from './prefs';

function Probe() {
  const { size, setSize } = usePrefs();
  return <button onClick={() => setSize(24)}>size {size}</button>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('size preference', () => {
  it('parses only the three sizes', () => {
    expect(parseSize('20')).toBe(20);
    expect(parseSize('24')).toBe(24);
    expect(parseSize('32')).toBe(16);
    expect(parseSize(null)).toBe(16);
  });

  it('loads the stored size after mount and saves changes', async () => {
    window.localStorage.setItem(SIZE_KEY, '20');
    render(<PrefsProvider><Probe /></PrefsProvider>);
    await screen.findByText('size 20');
    fireEvent.click(screen.getByText('size 20'));
    expect(screen.getByText('size 24')).toBeTruthy();
    expect(window.localStorage.getItem(SIZE_KEY)).toBe('24');
  });

  it('works with storage blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    render(<PrefsProvider><Probe /></PrefsProvider>);
    fireEvent.click(screen.getByText('size 16'));
    expect(screen.getByText('size 24')).toBeTruthy();
  });
});
