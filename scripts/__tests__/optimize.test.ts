import { describe, expect, it } from 'vitest';
import { optimizeSvg, withSize } from '../lib/optimize.js';
import { parseSvg } from '../lib/parse.js';
import { lintSvg } from '../lib/rules.js';
import { HOME_SVG, ROOT_ATTRS } from './fixtures.js';

describe('optimizeSvg', () => {
  it('strips comments and whitespace but keeps everything the rules need', async () => {
    const input = `﻿<svg ${ROOT_ATTRS}>\r\n  <!-- door -->\r\n  <path d="M2.75 6.5 8 2.25"/>\r\n</svg>\r\n`;
    const output = optimizeSvg(input);

    expect(output).not.toContain('door');
    expect(output).not.toContain('\n');
    expect(output).toContain('viewBox="0 0 16 16"');
    expect(output).toContain('stroke-linecap="round"');
    expect(output).toContain('stroke-linejoin="round"');
    expect(output).toContain('d="M2.75 6.5 8 2.25"');
  });

  it('produces output that still passes the linter', async () => {
    expect(lintSvg('home', await parseSvg(optimizeSvg(HOME_SVG)))).toEqual([]);
  });

  it('never converts shapes to paths', () => {
    const output = optimizeSvg(`<svg ${ROOT_ATTRS}><circle cx="8" cy="8" r="2"/></svg>`);
    expect(output).toContain('<circle');
  });

  it('keeps opacity on a solid rect and the 1.25 stroke width on a child path', () => {
    const output = optimizeSvg(
      `<svg ${ROOT_ATTRS}><rect x="2" y="9" width="3" height="5" rx="0.75" fill="currentColor" stroke="none" opacity="0.3"/><path d="M8 4v8" stroke-width="1.25"/></svg>`,
    );
    expect(output).toContain('opacity="0.3"');
    expect(output).toContain('stroke-width="1.25"');
  });
});

describe('withSize', () => {
  it('adds width and height to the root', () => {
    expect(withSize('<svg viewBox="0 0 16 16"/>')).toBe('<svg width="16" height="16" viewBox="0 0 16 16"/>');
  });
});
