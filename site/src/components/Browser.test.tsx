// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrefsProvider } from '../lib/prefs';
import { RouterProvider } from '../lib/router';
import { Browser } from './Browser';

function Harness({ selected = null, onOpen = vi.fn(), onMove = vi.fn() }: { selected?: string | null; onOpen?: (n: string) => void; onMove?: (n: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <RouterProvider initialPath="/">
      <PrefsProvider>
        <Browser query={query} onQuery={setQuery} selected={selected} onOpen={onOpen} onMove={onMove} />
      </PrefsProvider>
    </RouterProvider>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('Browser', () => {
  it('shows every icon in its category card', () => {
    render(<Harness />);
    expect(document.querySelectorAll('.cell')).toHaveLength(157);
    expect(screen.getByRole('button', { name: 'calendar' }).textContent).toBe('calendar');
    expect(screen.getByRole('heading', { name: /Navigation 22/ })).toBeTruthy();
  });

  it('filters as you type and hides empty categories', () => {
    render(<Harness />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search icons' }), { target: { value: 'calendar' } });
    expect(screen.getByRole('button', { name: 'calendar' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Navigation/ })).toBeNull();
  });

  it('says so when nothing matches, and clears', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Search icons' });
    fireEvent.change(input, { target: { value: '  zzzz ' } });
    expect(screen.getByText('No icons match “zzzz”.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect((input as HTMLInputElement).value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('focuses search with / and with Ctrl+K', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Search icons' });
    fireEvent.keyDown(document.body, { key: '/' });
    expect(document.activeElement).toBe(input);
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('does not steal "/" while typing in the search, and Cmd+K focuses it', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Search icons' });
    input.focus();
    expect(fireEvent.keyDown(input, { key: '/' })).toBe(true);
    expect(document.activeElement).toBe(input);
    input.blur();
    expect(fireEvent.keyDown(document.body, { key: '/', ctrlKey: true })).toBe(true);
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('leaves Alt+Arrow to the browser', () => {
    const onMove = vi.fn();
    render(<Harness selected="home" onMove={onMove} />);
    const home = screen.getByRole('button', { name: 'home' });
    home.focus();
    expect(fireEvent.keyDown(home, { key: 'ArrowRight', altKey: true })).toBe(true);
    expect(document.activeElement).toBe(home);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('clears the query with Escape', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Search icons' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'cal' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });

  it('opens an icon on click', () => {
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
    expect(onOpen).toHaveBeenCalledWith('calendar');
  });

  it('moves focus with the arrow keys, and moves the open drawer along', () => {
    const onMove = vi.fn();
    render(<Harness selected="home" onMove={onMove} />);
    const home = screen.getByRole('button', { name: 'home' });
    home.focus();
    fireEvent.keyDown(home, { key: 'ArrowRight' });
    const next = document.activeElement as HTMLElement;
    expect(next.dataset.name).not.toBe('home');
    expect(onMove).toHaveBeenCalledWith(next.dataset.name);
  });

  it('switches the icon size', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '24' }));
    expect(screen.getByRole('button', { name: '24' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.grid')?.getAttribute('data-size')).toBe('24');
  });
});
