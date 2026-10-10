import { describe, expect, it } from 'vitest';
import { elementBBox, geometryValues, hasAtMostTwoDecimals, onQuarterGrid } from '../lib/geometry.js';
import type { SvgElement } from '../lib/parse.js';

const el = (tag: string, attrs: Record<string, string>): SvgElement => ({ tag, attrs, children: [] });

describe('elementBBox', () => {
  it('measures circles, rects and lines', () => {
    expect(elementBBox(el('circle', { cx: '7', cy: '7', r: '4.5' }))).toEqual([2.5, 2.5, 11.5, 11.5]);
    expect(elementBBox(el('rect', { x: '2.25', y: '2.75', width: '11.5', height: '11' }))).toEqual([2.25, 2.75, 13.75, 13.75]);
    expect(elementBBox(el('line', { x1: '12', y1: '2', x2: '4', y2: '6' }))).toEqual([4, 2, 12, 6]);
  });

  it('measures paths including arcs', () => {
    const [minX, minY, maxX, maxY] = elementBBox(el('path', { d: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 1 1 0-12.5Z' }));
    expect([minX, minY, maxX, maxY].map((n) => Math.round(n * 1000) / 1000)).toEqual([1.75, 1.75, 14.25, 14.25]);
  });

  it('throws on broken path data', () => {
    expect(() => elementBBox(el('path', { d: 'M2 2 Q' }))).toThrow(/path data/);
  });

  it('throws on missing or blank path data', () => {
    expect(() => elementBBox(el('path', {}))).toThrow(/invalid path data: empty/);
  });
});

describe('geometryValues', () => {
  it('separates anchors from bezier handles in absolute coordinates', () => {
    const { anchors, handles } = geometryValues(el('path', { d: 'M3 13.25c.45-2.3 2.45-3.75 5-3.75s4.55 1.45 5 3.75' }));
    expect(anchors).toEqual([3, 13.25, 8, 9.5, 13, 13.25]);
    expect(handles.map((n) => Math.round(n * 100) / 100)).toEqual([3.45, 10.95, 5.45, 9.5, 12.55, 10.95]);
  });

  it('treats arc radii and endpoints as anchors and skips flags', () => {
    const { anchors, handles } = geometryValues(el('path', { d: 'M4 4a2 2 0 0 1 2 2' }));
    expect(anchors).toEqual([4, 4, 2, 2, 6, 6]);
    expect(handles).toEqual([]);
  });

  it('reads the geometry attributes of basic shapes, defaulting to 0', () => {
    expect(geometryValues(el('circle', { cx: '8', cy: '8', r: '2' })).anchors).toEqual([8, 8, 2]);
    expect(geometryValues(el('rect', { x: '2', y: '3', width: '4', height: '5' })).anchors).toEqual([2, 3, 4, 5, 0]);
    expect(geometryValues(el('line', { x1: '1', y1: '2', x2: '3', y2: '4' })).anchors).toEqual([1, 2, 3, 4]);
  });

  it('throws on non-numeric attributes', () => {
    expect(() => geometryValues(el('circle', { cx: 'abc', cy: '8', r: '2' }))).toThrow(/not a number/);
  });

  it('throws on blank attributes instead of reading them as 0', () => {
    expect(() => geometryValues(el('circle', { cx: '', cy: '8', r: '2' }))).toThrow(/not a number/);
    expect(() => geometryValues(el('circle', { cx: ' ', cy: '8', r: '2' }))).toThrow(/not a number/);
  });

  it('throws on blank path data', () => {
    expect(() => geometryValues(el('path', { d: '  ' }))).toThrow(/invalid path data: empty/);
  });
});

describe('grid checks', () => {
  it('accepts quarter steps and rejects anything else', () => {
    expect([0, 0.25, 2.75, 13.5, -1.25].every(onQuarterGrid)).toBe(true);
    expect([0.1, 2.9, 10.4, 6.125].some(onQuarterGrid)).toBe(false);
  });

  it('accepts handles with up to two decimals, despite float noise', () => {
    expect(hasAtMostTwoDecimals(13.75 - 1.45)).toBe(true);
    expect(hasAtMostTwoDecimals(3 + 0.45)).toBe(true);
    expect(hasAtMostTwoDecimals(3.333)).toBe(false);
  });

  it('keeps long relative chains on the grid', () => {
    const d = 'M2 2' + 'l.25.25'.repeat(40);
    const { anchors } = geometryValues(el('path', { d }));
    expect(anchors.every(onQuarterGrid)).toBe(true);
    expect(anchors.at(-1)).toBe(12);
  });
});
