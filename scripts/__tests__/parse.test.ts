import { describe, expect, it } from 'vitest';
import { parseSvg } from '../lib/parse.js';

describe('parseSvg', () => {
  it('returns the root and its element children with attributes', async () => {
    const root = await parseSvg('<svg viewBox="0 0 16 16"><path d="M2 2h12"/><circle cx="8" cy="8" r="2"/></svg>');

    expect(root.tag).toBe('svg');
    expect(root.attrs.viewBox).toBe('0 0 16 16');
    expect(root.children.map((c) => c.tag)).toEqual(['path', 'circle']);
    expect(root.children[0].attrs.d).toBe('M2 2h12');
  });

  it('drops text nodes between elements', async () => {
    const root = await parseSvg('<svg>\n  <path d="M2 2h12"/>\n</svg>');
    expect(root.children).toHaveLength(1);
  });

  it('keeps nested elements so the linter can report them', async () => {
    const root = await parseSvg('<svg><g><path d="M2 2h12"/></g></svg>');
    expect(root.children[0].tag).toBe('g');
    expect(root.children[0].children[0].tag).toBe('path');
  });

  it('tolerates a BOM and CRLF line endings', async () => {
    const root = await parseSvg('﻿<svg viewBox="0 0 16 16">\r\n  <path d="M2 2h12"/>\r\n</svg>\r\n');
    expect(root.children.map((c) => c.tag)).toEqual(['path']);
  });

  it('throws a readable error for malformed markup', async () => {
    await expect(parseSvg('<svg><path></svg>')).rejects.toThrow(/could not parse SVG/);
    await expect(parseSvg('not xml')).rejects.toThrow(/could not parse SVG/);
  });
});
