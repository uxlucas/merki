// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LINKS } from '../config';
import { iconByName } from '../data/icons';
import { Hero } from './Hero';
import { WALL_HIGHLIGHTS } from './WallBand';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe('Hero', () => {
  it('says what Merki is, in Lucas’s words', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('An icon library that obsesses over details');
    expect(screen.getByText(/I wanted a set of icons that felt familiar/)).toBeTruthy();
    expect(screen.getByText(/is a growing collection of bold, rounded icons for Figma and code/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Brought to you by Lucas Lima/ }).getAttribute('href')).toBe(LINKS.portfolio);
    expect(screen.getByText(/Crafted with/).textContent).toBe('Crafted with Claude Code and Figma');
  });

  it('links GitHub and shows Figma without a destination while it is null', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /GitHub/ }).getAttribute('href')).toBe(LINKS.github);
    const figma = screen.getByText('Figma community file').closest('a')!;
    expect(figma.hasAttribute('href')).toBe(LINKS.figma !== null);
    expect(figma.getAttribute('aria-disabled')).toBe(LINKS.figma === null ? 'true' : null);
  });

  it('shows the star count once GitHub answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ stargazers_count: 1234 }) })));
    render(<Hero />);
    expect(await screen.findByText('1.2k')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'GitHub , 1,234 stars' })).toBeTruthy();
    expect(screen.getByText('1.2k').closest('.stars')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('says "1 star" for a single star', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ stargazers_count: 1 }) })));
    render(<Hero />);
    expect(await screen.findByRole('link', { name: /1 star$/ })).toBeTruthy();
  });

  it('reads just "GitHub" when the repo is private', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    render(<Hero />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByRole('link', { name: /GitHub/ }).textContent).toBe('GitHub');
  });

  it('copies the install command and says so', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: "Copy npm i merki-icons" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('npm i merki-icons'));
    await screen.findByText('Copied');
  });

  it('highlights only real icons in the wall', () => {
    for (const name of WALL_HIGHLIGHTS) expect(iconByName.has(name)).toBe(true);
  });
});
