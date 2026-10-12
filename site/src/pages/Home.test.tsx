// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../App';

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  cleanup();
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  else delete (navigator as { clipboard?: unknown }).clipboard;
  window.history.replaceState(null, '', '/');
});

const start = (path: string) => {
  window.history.replaceState(null, '', path);
  return render(<App initialPath={path} />);
};

describe('icon drawer on the home page', () => {
  it('opens from the grid and pushes the icon url', () => {
    start('/');
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
    expect(window.location.pathname).toBe('/icons/calendar');
    expect(screen.getByRole('complementary', { name: 'calendar icon' })).toBeTruthy();
  });

  it('closes with Escape and goes back to the home url', async () => {
    start('/');
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('closes when the visitor presses back', async () => {
    start('/');
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
    window.history.back();
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('opens directly from an icon url and closes to /', async () => {
    start('/icons/bell');
    expect(screen.getByRole('complementary', { name: 'bell icon' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(window.location.pathname).toBe('/'));
  });

  it('closes to / after a direct visit and a click on another icon', async () => {
    start('/icons/bell');
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
    expect(window.location.pathname).toBe('/icons/calendar');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'calendar icon' })).toBeNull());
  });

  it('clears the search on the first Escape and closes on the second', async () => {
    start('/');
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'calendar' }));
    const length = window.history.length;
    const cell = screen.getByRole('button', { name: 'calendar' });
    cell.focus();
    fireEvent.keyDown(cell, { key: 'ArrowRight' });
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
