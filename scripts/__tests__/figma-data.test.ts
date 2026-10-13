import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figmaCategories, figmaDescription, toFigmaSvg, type SourceIcon } from '../lib/figma-data.js';

const icons = JSON.parse(readFileSync(new URL('../../site/src/data/icons.json', import.meta.url), 'utf8')) as SourceIcon[];
const order = JSON.parse(readFileSync(new URL('../../icons/_set.json', import.meta.url), 'utf8')) as Record<string, string[]>;
const byName = new Map(icons.map((i) => [i.name, i]));

describe('toFigmaSvg', () => {
  it('sizes the svg at 16 and swaps currentColor for black, which the sync rebinds to the icon variable', () => {
    const out = toFigmaSvg(byName.get('calendar')!.svg);
    expect(out.startsWith('<svg width="16" height="16" ')).toBe(true);
    expect(out).not.toContain('currentColor');
    expect(out).toContain('#000000');
  });

  it('keeps solid accents, dimmed shapes and the 1.25 detail weight', () => {
    expect(toFigmaSvg(byName.get('calendar')!.svg)).toContain('fill="#000000"');
    expect(toFigmaSvg(byName.get('priority-low')!.svg)).toContain('opacity="0.3"');
    expect(toFigmaSvg(byName.get('globe')!.svg)).toContain('stroke-width="1.25"');
  });
});

describe('figmaDescription', () => {
  it('lists the React name, tags and aliases, skipping empty lines', () => {
    const d = figmaDescription({ name: 'x', component: 'XIcon', category: 'actions', tags: ['close', 'remove'], aliases: [], svg: '' });
    expect(d).toBe('React: <XIcon />\nTags: close, remove');
    expect(figmaDescription({ name: 'a', component: 'AIcon', category: 'data', tags: [], aliases: ['b'], svg: '' })).toBe('React: <AIcon />\nAliases: b');
  });
});

describe('figmaCategories', () => {
  it('follows _set.json order and holds every icon exactly once', () => {
    const cats = figmaCategories(icons, order);
    expect(cats.map((c) => c.id)).toEqual(Object.keys(order));
    expect(cats[0].label).toBe('Navigation');
    const all = cats.flatMap((c) => c.icons);
    expect(all).toHaveLength(157);
    expect(new Set(all.map((i) => i.setName)).size).toBe(157);
    expect(cats.find((c) => c.id === 'objects')!.icons.find((i) => i.name === 'calendar')!.setName).toBe('objects/calendar');
  });

  it('refuses a manifest name the build does not have', () => {
    expect(() => figmaCategories(icons, { ...order, navigation: ['nope'] })).toThrow(/nope/);
  });
});
