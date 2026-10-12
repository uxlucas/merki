// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackToTop } from './BackToTop';

let fire: (visible: boolean) => void = () => {};
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) {
      fire = (visible) => cb([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() {}
    disconnect() {}
  });
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const setup = () =>
  render(
    <>
      <a className="logo" href="/">logo</a>
      <section className="hero">hero</section>
      <BackToTop watch=".hero" />
    </>,
  );

describe('BackToTop', () => {
  it('stays hidden and unfocusable while the hero is in view', () => {
    setup();
    const button = screen.getByLabelText('Back to top');
    expect(button.getAttribute('data-visible')).toBe('false');
    expect(button.getAttribute('tabindex')).toBe('-1');
    expect(button.getAttribute('aria-hidden')).toBe('true');
  });

  it('appears once the hero leaves, and goes back up', () => {
    setup();
    act(() => fire(false));
    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button.getAttribute('data-visible')).toBe('true');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(document.activeElement?.className).toBe('logo');
  });

  it('hands focus to the logo when it hides while focused', () => {
    setup();
    act(() => fire(false));
    const button = screen.getByRole('button', { name: 'Back to top' });
    button.focus();
    expect(document.activeElement).toBe(button);
    act(() => fire(true));
    expect(document.activeElement?.className).toBe('logo');
    expect(button.getAttribute('tabindex')).toBe('-1');
  });

  it('leaves focus alone when something else has it', () => {
    setup();
    act(() => fire(false));
    const other = document.createElement('input');
    document.body.append(other);
    other.focus();
    act(() => fire(true));
    expect(document.activeElement).toBe(other);
    other.remove();
  });
});
