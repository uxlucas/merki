// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { createElement, createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createIcon, type IconNode } from '../src/create-icon.js';

const NODE: IconNode = [
  ['rect', { x: '2.25', y: '2.75', width: '11.5', height: '11', rx: '2' }],
  ['path', { d: 'M2.25 4.75a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2V6.5H2.25Z', fill: 'currentColor', stroke: 'none' }],
];
const CalendarIcon = createIcon('calendar', NODE);

const svgOf = (element: Parameters<typeof render>[0]) => render(element).container.querySelector('svg')!;

afterEach(cleanup);

describe('createIcon', () => {
  it('renders the spec defaults', () => {
    const svg = svgOf(createElement(CalendarIcon));
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('height')).toBe('16');
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
    expect(svg.getAttribute('stroke-linecap')).toBe('round');
    expect(svg.getAttribute('stroke-linejoin')).toBe('round');
    expect(svg.getAttribute('class')).toBe('merki merki-calendar');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('color')).toBeNull();
    expect(svg.querySelectorAll('rect, path')).toHaveLength(2);
    expect(svg.querySelector('path')!.getAttribute('fill')).toBe('currentColor');
  });

  it('sizes with numbers and CSS strings', () => {
    expect(svgOf(createElement(CalendarIcon, { size: 20 })).getAttribute('width')).toBe('20');
    expect(svgOf(createElement(CalendarIcon, { size: '2rem' })).getAttribute('height')).toBe('2rem');
  });

  it('title makes the icon an announced image', () => {
    const svg = svgOf(createElement(CalendarIcon, { title: 'Due date' }));
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Due date');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.querySelector('title')!.textContent).toBe('Due date');
  });

  it('aria-label alone still makes it visible to screen readers', () => {
    const svg = svgOf(createElement(CalendarIcon, { 'aria-label': 'Due date' }));
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Due date');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('color recolors fills and strokes alike', () => {
    const svg = svgOf(createElement(CalendarIcon, { color: 'red' }));
    expect(svg.getAttribute('color')).toBe('red');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.querySelector('path')!.getAttribute('fill')).toBe('currentColor');
  });

  it('absoluteStrokeWidth keeps strokes at screen size, even for CSS sizes', () => {
    const svg = svgOf(createElement(CalendarIcon, { size: '2rem', absoluteStrokeWidth: true }));
    const shapes = [...svg.querySelectorAll('rect, path')];
    expect(shapes.map((s) => s.getAttribute('vector-effect'))).toEqual(['non-scaling-stroke', 'non-scaling-stroke']);
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
  });

  it('stroke width cannot be overridden', () => {
    const extra = { strokeWidth: 3 } as Record<string, unknown>;
    const svg = svgOf(createElement(CalendarIcon, { ...extra }));
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
  });

  it('merges className and passes other props through', () => {
    const extra = { 'data-testid': 'cal' } as Record<string, string>;
    const svg = svgOf(createElement(CalendarIcon, { className: 'text-muted', style: { opacity: 0.5 }, ...extra }));
    expect(svg.getAttribute('class')).toBe('merki merki-calendar text-muted');
    expect(svg.getAttribute('data-testid')).toBe('cal');
    expect(svg.style.opacity).toBe('0.5');
  });

  it('forwards refs to the svg element', () => {
    const ref = createRef<SVGSVGElement>();
    render(createElement(CalendarIcon, { ref }));
    expect(ref.current?.tagName.toLowerCase()).toBe('svg');
  });

  it('renders no ids, even twice', () => {
    const { container } = render(createElement('div', null, createElement(CalendarIcon), createElement(CalendarIcon, { title: 'Due' })));
    expect(container.querySelectorAll('[id]')).toHaveLength(0);
  });

  it('has a readable display name', () => {
    expect(CalendarIcon.displayName).toBe('CalendarIcon');
  });
});
