import { describe, expect, it } from 'vitest';
import { parseSvg } from '../lib/parse.js';
import { lintMeta, lintName, lintSvg, type Violation } from '../lib/rules.js';
import { HOME_SVG, ROOT_ATTRS, wrap } from './fixtures.js';

const lint = async (body: string, rootAttrs?: string): Promise<Violation[]> =>
  lintSvg('test', await parseSvg(wrap(body, rootAttrs)));
const rules = (violations: Violation[]): string[] => [...new Set(violations.map((v) => v.rule))].sort();

describe('lintSvg', () => {
  it('passes a clean icon', async () => {
    expect(lintSvg('home', await parseSvg(HOME_SVG))).toEqual([]);
  });

  it('requires the 16px viewBox', async () => {
    expect(rules(await lint('<path d="M2 2h4"/>', ROOT_ATTRS.replace('0 0 16 16', '0 0 24 24')))).toEqual(['viewbox']);
  });

  it('requires the stroke attributes on the root and nothing extra', async () => {
    expect(rules(await lint('<path d="M2 2h4"/>', ROOT_ATTRS.replace('stroke-width="1.5"', 'stroke-width="2"')))).toEqual(['root-attrs']);
    expect(rules(await lint('<path d="M2 2h4"/>', `${ROOT_ATTRS} width="16"`))).toEqual(['root-attrs']);
  });

  it('requires the exact xmlns on the root', async () => {
    expect(rules(await lint('<path d="M2 2h4"/>', ROOT_ATTRS.replace('xmlns="http://www.w3.org/2000/svg" ', '')))).toEqual(['root-attrs']);
    expect(rules(await lint('<path d="M2 2h4"/>', ROOT_ATTRS.replace('/svg"', '/svgx"')))).toEqual(['root-attrs']);
  });

  it('reports an empty icon', async () => {
    expect(rules(await lint(''))).toEqual(['empty']);
  });

  it('rejects groups, masks and nested elements', async () => {
    expect(rules(await lint('<g><path d="M2 2h4"/></g>'))).toContain('elements');
    expect(rules(await lint('<mask/><path d="M2 2h4"/>'))).toContain('elements');
  });

  it('rejects attributes outside the allow-list', async () => {
    expect(rules(await lint('<path d="M2 2h4" transform="rotate(45 8 8)"/>'))).toEqual(['attributes']);
    expect(rules(await lint('<path d="M2 2h4" id="a"/>'))).toEqual(['attributes']);
    expect(rules(await lint('<path d="M2 2h4" stroke-width="2"/>'))).toEqual(['attributes']);
    expect(rules(await lint('<path d="M2 2h4" stroke-dasharray="1 1"/>'))).toEqual(['attributes']);
  });

  it('allows dashes on circles', async () => {
    expect(await lint('<circle cx="8" cy="8" r="5.5" stroke-dasharray="1 3.32" stroke-dashoffset="0.5"/>')).toEqual([]);
  });

  it('allows only currentColor and none as colors', async () => {
    expect(rules(await lint('<path d="M2 2h4" stroke="#000"/>'))).toEqual(['color']);
    expect(await lint('<circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>')).toEqual([]);
  });

  it('allows opacity 0.3 only on solid shapes', async () => {
    expect(await lint('<rect x="2.5" y="9.5" width="2.5" height="4.25" rx=".75" fill="currentColor" stroke="none" opacity="0.3"/>')).toEqual([]);
    expect(await lint('<circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" opacity="0.3"/>')).toEqual([]);
    expect(rules(await lint('<rect x="2.5" y="9.5" width="2.5" height="4.25" rx=".75" fill="currentColor" stroke="none" opacity="0.5"/>'))).toEqual(['color']);
    expect(rules(await lint('<path d="M2 2h4" opacity="0.3"/>'))).toEqual(['attributes']);
  });

  it('puts anchors on the quarter grid', async () => {
    const violations = await lint('<path d="M2.1 2h4"/><circle cx="8" cy="8" r="4.6"/>');
    expect(rules(violations)).toEqual(['grid']);
    expect(violations.map((v) => v.detail).join(' ')).toMatch(/2\.1.*4\.6/);
  });

  it('prints raw values in grid messages, not rounded ones', async () => {
    const violations = await lint('<path d="M2.0004 2h4"/>');
    expect(rules(violations)).toEqual(['grid']);
    expect(violations[0].detail).toContain('2.0004');
  });

  it('allows two-decimal handles and rejects finer ones', async () => {
    expect(await lint('<path d="M3 13.25c.45-2.3 2.45-3.75 5-3.75s4.55 1.45 5 3.75"/>')).toEqual([]);
    expect(rules(await lint('<path d="M3 13c.333-1 .5-1 1 0"/>'))).toEqual(['handles']);
  });

  it('keeps strokes inside the 1px padding', async () => {
    expect(rules(await lint('<path d="M1.5 8h4"/>'))).toEqual(['bounds']);
    expect(rules(await lint('<circle cx="8" cy="8" r="7"/>'))).toEqual(['bounds']);
  });

  it('lets unstroked solids reach the padding edge', async () => {
    expect(await lint('<circle cx="8" cy="8" r="7" fill="currentColor" stroke="none"/>')).toEqual([]);
  });

  it('reports every problem in a typical Figma paste', async () => {
    const figma =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<g><path d="M2.1 2H6" stroke="black" stroke-width="1.5"/></g></svg>';
    const violations = lintSvg('pasted', await parseSvg(figma));
    expect(rules(violations)).toEqual(['elements', 'root-attrs']);
    expect(violations.every((v) => v.icon === 'pasted')).toBe(true);

    const unwrapped = figma.replace('<g>', '').replace('</g>', '');
    expect(rules(lintSvg('pasted', await parseSvg(unwrapped)))).toEqual(['attributes', 'color', 'grid', 'root-attrs']);
  });

  it('reports unreadable geometry instead of throwing', async () => {
    expect(rules(await lint('<path d="M2 2 Q"/>'))).toEqual(['parse']);
  });

  it('reports shapes with missing or non-positive size', async () => {
    expect(rules(await lint('<circle cx="8" cy="8"/>'))).toEqual(['parse']);
    expect(rules(await lint('<circle cx="8" cy="8" r="0"/>'))).toEqual(['parse']);
    expect(rules(await lint('<rect x="2" y="2" height="4"/>'))).toEqual(['parse']);
    expect(rules(await lint('<rect x="2" y="2" width="-4" height="4"/>'))).toEqual(['parse']);
    expect((await lint('<circle cx="8" cy="8"/>'))[0].detail).toMatch(/needs r/);
  });
});

describe('lintName', () => {
  it('accepts kebab-case and rejects everything else', () => {
    expect(lintName('arrow-up-right')).toEqual([]);
    expect(lintName('arrow-up-2')).toEqual([]);
    for (const bad of ['ArrowUp', 'arrow_up', 'arrow--up', '-x', 'x-', 'arrow up', '2fa', '3d-box']) {
      expect(lintName(bad).map((v) => v.rule)).toEqual(['name']);
    }
  });
});

describe('lintMeta', () => {
  it('returns parsed metadata when valid', () => {
    const result = lintMeta('home', JSON.stringify({ category: 'navigation', tags: ['house'], aliases: [] }));
    expect(result.violations).toEqual([]);
    expect(result.meta).toEqual({ category: 'navigation', tags: ['house'], aliases: [] });
  });

  it('reports missing, broken and wrong metadata', () => {
    expect(lintMeta('home', null).violations.map((v) => v.detail)).toEqual(['missing home.json']);
    expect(lintMeta('home', '{').violations[0].detail).toMatch(/not valid JSON/);
    expect(lintMeta('home', JSON.stringify({ category: 'nav', tags: [], aliases: [] })).violations[0].detail).toMatch(/category "nav"/);
    expect(lintMeta('home', JSON.stringify({ category: 'navigation', tags: 'house', aliases: [] })).violations[0].detail).toMatch(/tags/);
    expect(lintMeta('home', JSON.stringify({ category: 'navigation', tags: [] })).violations[0].detail).toMatch(/aliases/);
  });
});
