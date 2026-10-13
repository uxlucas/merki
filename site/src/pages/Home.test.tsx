// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  cleanup();
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  else delete (navigator as { clipboard?: unknown }).clipboard;
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

const start = (path: string) => {
  window.history.replaceState(null, '', path);
  return render(<App initialPath={path} />);
};

// The craft cards also have a "calendar" button, so grid cells are looked up inside the Icons section.
const cell = (name: string) => within(document.getElementById('icons')!).getByRole('button', { name });

describe('icon drawer on the home page', () => {
  it('opens from the grid and pushes the icon url', () => {
    start('/');
    fireEvent.click(cell('calendar'));
    expect(window.location.pathname).toBe('/icons/calendar');
    expect(screen.getByRole('complementary', { name: 'calendar icon' })).toBeTruthy();
  });

  it('keeps the scroll position when the drawer closes', async () => {
    // Closing steps back in history; the browser must not restore the scroll saved when the drawer opened.
    // jsdom has no scrollRestoration, so give history the real browser's default.
    Object.defineProperty(window.history, 'scrollRestoration', { value: 'auto', writable: true, configurable: true });
    start('/');
    expect(window.history.scrollRestoration).toBe('auto');
    fireEvent.click(cell('calendar'));
    expect(window.history.scrollRestoration).toBe('manual');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    // Back on the grid, real page navigations restore scroll again.
    await waitFor(() => expect(window.history.scrollRestoration).toBe('auto'));
  });

  it('closes with Escape and goes back to the home url', async () => {
    start('/');
    fireEvent.click(cell('calendar'));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('steps back once when Escape is pressed twice before the first back settles', async () => {
    start('/');
    fireEvent.click(cell('calendar'));
    const opened = window.history.length;
    const back = vi.spyOn(window.history, 'back');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(back).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
    expect(window.history.length).toBe(opened); // back() keeps entries; nothing was pushed or dropped
    expect(window.location.pathname).toBe('/');
  });

  it('keeps the drawer mounted while it animates out, then removes it', async () => {
    start('/icons/calendar'); // a direct visit closes with navigate('/'), which is synchronous; history.back() would settle later
    fireEvent.keyDown(document.body, { key: 'Escape' });
    const aside = document.querySelector('aside.drawer');
    expect(aside?.getAttribute('data-state')).toBe('closing');
    await waitFor(() => expect(document.querySelector('aside.drawer')).toBeNull());
  });

  it('closes when the visitor presses back', async () => {
    start('/');
    fireEvent.click(cell('calendar'));
    window.history.back();
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('does not step back again when Escape follows Back mid-exit', async () => {
    start('/');
    fireEvent.click(cell('calendar'));
    window.history.back();
    await waitFor(() => expect(document.querySelector('aside.drawer')?.getAttribute('data-state')).toBe('closing'));
    const back = vi.spyOn(window.history, 'back');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(back).toHaveBeenCalledTimes(0);
    await waitFor(() => expect(document.querySelector('aside.drawer')).toBeNull());
    expect(back).toHaveBeenCalledTimes(0);
    expect(window.location.pathname).toBe('/');
  });

  it('opens directly from an icon url and closes to /', async () => {
    start('/icons/bell');
    expect(screen.getByRole('complementary', { name: 'bell icon' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(window.location.pathname).toBe('/'));
  });

  it('closes to / after a direct visit and a click on another icon', async () => {
    start('/icons/bell');
    fireEvent.click(cell('calendar'));
    expect(window.location.pathname).toBe('/icons/calendar');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('clears the search on the first Escape and closes on the second', async () => {
    start('/');
    fireEvent.click(cell('calendar'));
    const input = screen.getByRole('searchbox', { name: 'Search icons' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'bell' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
    expect(screen.getByRole('complementary', { name: 'calendar icon' })).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('follows the arrow keys while open, without adding history entries', () => {
    start('/');
    fireEvent.click(cell('calendar'));
    const length = window.history.length;
    const target = cell('calendar');
    target.focus();
    fireEvent.keyDown(target, { key: 'ArrowRight' });
    expect(window.location.pathname).not.toBe('/icons/calendar');
    expect(window.history.length).toBe(length);
  });

  it('shows copy and download actions', () => {
    start('/icons/calendar');
    expect(screen.getByRole('button', { name: /Copy SVG/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Copy JSX/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download/ })).toBeTruthy();
  });

  it('says "Couldn\'t copy" when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = () => false;
    start('/icons/calendar');
    fireEvent.click(screen.getByRole('button', { name: /Copy SVG/ }));
    await screen.findByText("Couldn't copy");
    expect(screen.queryByText('Copied')).toBeNull();
  });
});
