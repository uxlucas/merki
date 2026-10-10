import { describe, expect, it } from 'vitest';
import { renderSheet } from '../lib/sheet.js';
import { HOME_SVG, SEARCH_SVG } from './fixtures.js';

const pngSize = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

describe('renderSheet', () => {
  it('renders a PNG with one row per icon', () => {
    const one = renderSheet([{ name: 'home', svg: HOME_SVG }]);
    const two = renderSheet([{ name: 'home', svg: HOME_SVG }, { name: 'search', svg: SEARCH_SVG }]);

    expect(one.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(pngSize(one).width).toBe(pngSize(two).width);
    expect(pngSize(two).height).toBeGreaterThan(pngSize(one).height);
  });

  it('renders icons that would fail lint instead of throwing', () => {
    const broken = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2.1 2h4"/></svg>';
    expect(() => renderSheet([{ name: 'broken', svg: broken }])).not.toThrow();
  });
});
