// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RouterProvider } from '../lib/router';
import { Logo } from './Logo';

afterEach(cleanup);

describe('Logo', () => {
  it('links home with the mono wordmark', () => {
    render(<RouterProvider initialPath="/guide/react"><Logo /></RouterProvider>);
    const link = screen.getByRole('link', { name: 'merki-icons home' });
    expect(link.getAttribute('href')).toBe('/');
    const word = link.querySelector('.logo-word')!;
    expect(word.textContent).toBe('merki-icons');
    // The glitch slices copy the wordmark through attr(data-text).
    expect(word.getAttribute('data-text')).toBe('merki-icons');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
