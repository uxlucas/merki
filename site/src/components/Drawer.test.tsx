// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { iconByName } from '../data/icons';
import { Drawer } from './Drawer';

afterEach(cleanup);
const calendar = iconByName.get('calendar')!;
const setup = () => render(<Drawer icon={calendar} onClose={vi.fn()} />);

describe('Drawer', () => {
  it('leads with the crumb, the name and the tags', () => {
    setup();
    const aside = screen.getByRole('complementary', { name: 'calendar icon' });
    expect(within(aside).getByRole('heading', { level: 2 }).textContent).toBe('calendar');
    expect(within(aside).getByText(calendar.tags[0])).toBeTruthy();
    expect(aside.querySelector('.drawer-crumb')?.textContent).toContain('Objects');
  });

  it('switches tabs with clicks and arrow keys, one tab stop', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Preview', 'Construction', 'In context']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(tabs[0].id);
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
    expect(screen.getAllByRole('tab')[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: 'Keylines' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('tab')[2]);
    expect(screen.getByRole('tabpanel').textContent).toContain('Inbox');
  });

  it('shows the icon in a toolbar, never as a search field\'s icon', () => {
    setup();
    fireEvent.click(screen.getAllByRole('tab')[2]);
    const panel = screen.getByRole('tabpanel');
    expect(panel.textContent).not.toContain('Search or type');
    const tools = panel.querySelectorAll('.ctx-toolbar .ctx-tool');
    expect(tools).toHaveLength(3);
    expect(tools[1].classList.contains('is-current')).toBe(true);
    expect(tools[1].querySelector('svg')?.getAttribute('class')).toContain('merki-calendar');
  });

  it('keeps each tab\'s controls inside its panel, and swatches follow Home and End', () => {
    setup();
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Default' }), { key: 'End' });
    expect(screen.getByRole('radio', { name: 'Violet' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Violet' }), { key: 'Home' });
    expect(screen.getByRole('radio', { name: 'Default' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(within(screen.getByRole('tabpanel')).getByRole('button', { name: 'Points' })).toBeTruthy();
    expect(screen.getByRole('tabpanel').querySelector('.construction')).toBeTruthy();
  });

  it('previews a colour and a size, copies them, and resets', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Size' }), { target: { value: '32' } });
    const preview = document.querySelector('.preview svg')!;
    expect(preview.getAttribute('width')).toBe('32');
    expect(preview.getAttribute('color')).toBe('#2563eb');
    expect(screen.getByText('#2563EB')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(document.querySelector('.preview svg')!.getAttribute('width')).toBe('16');
    expect(screen.getByRole('radio', { name: 'Default' }).getAttribute('aria-checked')).toBe('true');
  });

  it('keeps Reset mounted but hidden and unfocusable while the look is default', () => {
    setup();
    const reset = document.querySelector<HTMLButtonElement>('button[aria-label="Reset"]')!;
    expect(reset.classList.contains('is-hidden')).toBe(true);
    expect(reset.getAttribute('aria-hidden')).toBe('true');
    expect(reset.tabIndex).toBe(-1);
    expect(reset.disabled).toBe(true);
    fireEvent.change(screen.getByRole('slider', { name: 'Size' }), { target: { value: '32' } });
    const live = screen.getByRole<HTMLButtonElement>('button', { name: 'Reset' });
    expect(live).toBe(reset);
    expect(live.classList.contains('is-hidden')).toBe(false);
    expect(live.disabled).toBe(false);
  });

  it('moves focus to Download when Reset is activated', () => {
    setup();
    fireEvent.change(screen.getByRole('slider', { name: 'Size' }), { target: { value: '32' } });
    const reset = screen.getByRole('button', { name: 'Reset' });
    reset.focus();
    expect(document.activeElement).toBe(reset);
    fireEvent.click(reset);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
    expect(document.querySelector('.preview svg')!.getAttribute('width')).toBe('16');
  });
});
