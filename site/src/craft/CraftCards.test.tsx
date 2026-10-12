// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CRAFT_TOPICS } from './topics';
import { CraftCards } from './CraftCards';

afterEach(cleanup);
const card = (slug: string) => document.getElementById(`craft-${slug}`)!;

describe('CraftCards', () => {
  it('renders one card per topic, each marked "Article soon"', () => {
    render(<CraftCards />);
    for (const topic of CRAFT_TOPICS) {
      expect(within(card(topic.slug)).getByRole('heading', { name: topic.title })).toBeTruthy();
      expect(within(card(topic.slug)).getByText('Article soon')).toBeTruthy();
    }
  });

  it('never claims 1.5 holds at every size', () => {
    render(<CraftCards />);
    const c = within(card('one-stroke'));
    expect(c.getByText('Tuned for 16 and 20. Bigger, the stroke scales with the icon, or you pin it at 1.5.')).toBeTruthy();
    expect(c.getByText('3px')).toBeTruthy(); // 32px, scaled
    fireEvent.change(c.getByRole('slider', { name: 'Icon size' }), { target: { value: '64' } });
    expect(c.getByText('6px')).toBeTruthy();
    expect(c.getByRole('button', { name: 'Absolute stroke' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(c.getByRole('button', { name: 'Absolute stroke' }));
    expect(c.getByText('1.5px')).toBeTruthy();
    expect(c.getByRole('button', { name: 'Absolute stroke' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('grows the circle by eye', () => {
    render(<CraftCards />);
    const c = within(card('looks-right'));
    expect(c.getByText('Equal on paper: 11.5 and 11.5')).toBeTruthy();
    fireEvent.click(c.getByRole('button', { name: 'By eye' }));
    expect(c.getByText('Equal by eye: circle 12, square 11.5')).toBeTruthy();
    expect(card('looks-right').querySelector('circle')?.getAttribute('r')).toBe('6');
  });

  it('turns solid accents off', () => {
    render(<CraftCards />);
    const c = within(card('solid-accents'));
    expect(c.getByRole('button', { name: 'Solid accents' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(c.getByRole('button', { name: 'Solid accents' }));
    expect(c.getByRole('button', { name: 'Solid accents' }).getAttribute('aria-pressed')).toBe('false');
    expect(card('solid-accents').querySelector('.solid')?.classList.contains('off')).toBe(true);
  });

  it('switches the in-context menu to dark', () => {
    render(<CraftCards />);
    fireEvent.click(within(card('in-context')).getByRole('button', { name: 'Dark' }));
    expect(card('in-context').querySelector('[data-theme="dark"]')).toBeTruthy();
  });

  it('counts the heart anchors from the parser', () => {
    render(<CraftCards />);
    expect(within(card('points')).getByText('Every anchor on a quarter-pixel grid. 9 on heart.')).toBeTruthy();
    fireEvent.click(within(card('points')).getByRole('button', { name: 'Show handles' }));
    expect(card('points').querySelector('.c-handles')).toBeTruthy();
  });

  it('swaps the keylines icon', () => {
    render(<CraftCards />);
    fireEvent.click(within(card('keylines')).getByRole('button', { name: 'settings' }));
    expect(within(card('keylines')).getByRole('button', { name: 'settings' }).getAttribute('aria-pressed')).toBe('true');
  });
});
