import { beforeEach, describe, expect, it } from 'vitest';
import { DRAW_VERSION, checkComponents, deprecateMissing, ensureIconVariable, fingerprint, ensurePages, gridPosition, syncCategory } from '../figma/core.js';
import { createFakeFigma, type FakeFigma } from './fake-figma.js';

let fake: FakeFigma;
beforeEach(async () => {
  fake = createFakeFigma();
  (globalThis as any).figma = fake.figma;
  await ensurePages();
});

const pascal = (name: string) => name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
const icon = (name: string, svg = '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>') => ({
  name,
  category: 'objects',
  setName: `objects/${name}`,
  description: `React: ${pascal(name)}Icon`,
  svg,
});
const OTHER_SVG = '<svg width="16" height="16"><path d="M2 2" stroke="#000000"/></svg>';
const componentsPage = () => fake.pages().find((p) => p.name === 'Components')!;
/** What a variant stores: the drawing version, the icon variable it is bound to, and the svg fingerprint. */
const stored = async (svg: string) => `${DRAW_VERSION}:${(await ensureIconVariable()).id}:${fingerprint(svg)}`;
const category = (icons: ReturnType<typeof icon>[], previousLabel: string | null = null) => ({ id: 'objects', label: 'Objects', previousLabel, icons });
const sets = () => fake.pages().find((p) => p.name === 'Components')!.findAllWithCriteria({ types: ['COMPONENT_SET'] });

describe('ensurePages and the icon variable', () => {
  it('creates the five pages in order, reusing the blank first page', async () => {
    expect(fake.pages().map((p) => p.name)).toEqual(['Cover', 'Icons', 'Components', 'Construction', 'Changelog']);
    await ensurePages();
    expect(fake.pages()).toHaveLength(5);
  });

  it('creates the Merki collection with Light and Dark, once', async () => {
    const v = await ensureIconVariable();
    const again = await ensureIconVariable();
    expect(again.id).toBe(v.id);
    expect(v.name).toBe('icon');
    expect(v.scopes).toEqual(['STROKE_COLOR', 'SHAPE_FILL']);
    const [collection] = await fake.figma.variables.getLocalVariableCollectionsAsync();
    expect(collection.name).toBe('Merki');
    expect(collection.modes.map((m: any) => m.name)).toEqual(['Light', 'Dark']);
  });
});

describe('syncCategory', () => {
  it('builds one set per icon with Size=16/20/24, scaled drawings and bound paints', async () => {
    const result = await syncCategory(category([icon('calendar'), icon('tag')]));
    expect(result).toMatchObject({ sets: 2, created: 2, updated: 0 });
    const [set] = sets();
    expect(set.name).toBe('objects/calendar');
    expect(set.description).toBe('React: CalendarIcon');
    expect(set.children.map((c) => c.name)).toEqual(['Size=16', 'Size=20', 'Size=24']);
    expect(set.children.map((c) => c.width)).toEqual([16, 20, 24]);
    expect(set.children[2].children[0].scale).toBe(1.5);
    expect(set.children[0].children[0].strokes[0].boundVariables.color.id).toMatch(/^VariableID:/);
    expect(set.parent!.type).toBe('SECTION');
    expect(set.parent!.name).toBe('Objects');
  });

  it('updates in place on a second run: same set and variant ids, new drawing', async () => {
    await syncCategory(category([icon('calendar')]));
    const [set] = sets();
    const ids = [set.id, ...set.children.map((c) => c.id)];
    const result = await syncCategory(category([icon('calendar', OTHER_SVG)]));
    expect(result).toMatchObject({ sets: 1, created: 0, updated: 1 });
    expect(sets()).toHaveLength(1);
    const [again] = sets();
    expect([again.id, ...again.children.map((c) => c.id)]).toEqual(ids);
    expect((again.children[0].children[0] as any).svg).toContain('M2 2');
    expect(again.children[0].children).toHaveLength(1);
  });

  it('keeps paint opacity when binding (dimmed solid shapes)', async () => {
    await syncCategory(category([icon('priority-low', '<svg width="16" height="16"><path d="M1 1" fill="#000000" opacity="0.3"/></svg>')]));
    const fill = sets()[0].children[0].children[0].fills[0];
    expect(fill.opacity).toBe(0.3);
    expect(fill.boundVariables.color.id).toMatch(/^VariableID:/);
  });

  it('leaves unchanged drawings alone on a second identical run', async () => {
    const first = await syncCategory(category([icon('calendar'), icon('tag')]));
    expect(first).toMatchObject({ redrawn: 6, unchanged: 0 });
    const drawings = sets().map((s) => s.children.map((v) => v.children[0].id));
    const again = await syncCategory(category([icon('calendar'), icon('tag')]));
    expect(again).toMatchObject({ sets: 2, created: 0, updated: 2, redrawn: 0, unchanged: 6 });
    expect(sets().map((s) => s.children.map((v) => v.children[0].id))).toEqual(drawings);
    expect(sets()[0].children[0].getSharedPluginData('merki', 'svg')).toBe(await stored(icon('calendar').svg));
  });

  it('redraws only the variants of an icon whose svg changed', async () => {
    await syncCategory(category([icon('calendar'), icon('tag')]));
    const tagDrawings = sets()[1].children.map((v) => v.children[0].id);
    const result = await syncCategory(category([icon('calendar', OTHER_SVG), icon('tag')]));
    expect(result).toMatchObject({ redrawn: 3, unchanged: 3 });
    expect((sets()[0].children[1].children[0] as any).svg).toContain('M2 2');
    expect(sets()[0].children[1].getSharedPluginData('merki', 'svg')).toBe(await stored(OTHER_SVG));
    expect(sets()[1].children.map((v) => v.children[0].id)).toEqual(tagDrawings);
  });

  it('redraws a variant whose fingerprint matches but which has no drawing', async () => {
    await syncCategory(category([icon('calendar')]));
    const variant = sets()[0].children[1];
    for (const child of [...variant.children]) child.remove();
    const result = await syncCategory(category([icon('calendar')]));
    expect(result).toMatchObject({ redrawn: 1, unchanged: 2 });
    expect(variant.children).toHaveLength(1);
  });

  it('redraws everything when the icon variable is recreated', async () => {
    await syncCategory(category([icon('calendar')]));
    const [old] = await fake.figma.variables.getLocalVariablesAsync();
    old.name = 'retired';
    const result = await syncCategory(category([icon('calendar')]));
    expect(result).toMatchObject({ redrawn: 3, unchanged: 0 });
    expect(sets()[0].children[0].children[0].strokes[0].boundVariables.color.id).not.toBe(old.id);
  });

  it('redraws a variant stored under an older drawing version', async () => {
    await syncCategory(category([icon('calendar')]));
    const variant = sets()[0].children[0];
    variant.setSharedPluginData('merki', 'svg', (await stored(icon('calendar').svg)).replace(`${DRAW_VERSION}:`, `${DRAW_VERSION - 1}:`));
    expect(await syncCategory(category([icon('calendar')]))).toMatchObject({ redrawn: 1, unchanged: 2 });
    expect(variant.getSharedPluginData('merki', 'svg')).toBe(await stored(icon('calendar').svg));
  });

  it('clears the stored value before drawing, so a draw that fails midway is redrawn next run', async () => {
    await syncCategory(category([icon('calendar')]));
    const variables = fake.figma.variables;
    const bind = variables.setBoundVariableForPaint;
    variables.setBoundVariableForPaint = () => {
      variables.setBoundVariableForPaint = bind;
      throw new Error('bind failed');
    };
    await expect(syncCategory(category([icon('calendar', OTHER_SVG)]))).rejects.toThrow(/bind failed/);
    const variant = sets()[0].children[0];
    expect(variant.children).toHaveLength(1);
    expect(variant.getSharedPluginData('merki', 'svg')).toBe('');
    // Back to the first svg: the half-drawn variant must not be taken for it.
    expect(await syncCategory(category([icon('calendar')]))).toMatchObject({ redrawn: 1, unchanged: 2 });
    expect((variant.children[0] as any).svg).toContain('M1 1');
  });

  it('names a new set before drawing it, so an interrupted run leaves a set the next run repairs', async () => {
    fake.failSvgImport(1);
    await expect(syncCategory(category([icon('x')]))).rejects.toThrow(/svg import failed/);
    const page = componentsPage();
    expect(sets().map((s) => s.name)).toEqual(['objects/x']);
    expect(page.findAllWithCriteria({ types: ['COMPONENT'] }).filter((c) => c.parent!.type !== 'COMPONENT_SET')).toEqual([]);
    const [set] = sets();
    const ids = [set.id, ...set.children.map((c) => c.id)];
    expect(set.children.map((c) => c.children.length)).toEqual([1, 0, 0]);
    const result = await syncCategory(category([icon('x')]));
    expect(result).toMatchObject({ created: 0, redrawn: 2, unchanged: 1 });
    expect(sets()).toHaveLength(1);
    expect([sets()[0].id, ...sets()[0].children.map((c) => c.id)]).toEqual(ids);
    expect(sets()[0].children.map((c) => c.children.length)).toEqual([1, 1, 1]);
  });

  it('places the section below the previous category', async () => {
    await syncCategory({ id: 'navigation', label: 'Navigation', previousLabel: null, icons: [icon('home')] });
    await syncCategory(category([icon('calendar')], 'Navigation'));
    const page = fake.pages().find((p) => p.name === 'Components')!;
    const nav = page.children.find((n) => n.name === 'Navigation')!;
    const obj = page.children.find((n) => n.name === 'Objects')!;
    expect(obj.y).toBeGreaterThanOrEqual(nav.y + nav.height);
  });
});

describe('deprecateMissing', () => {
  it('moves sets the repo no longer has into Deprecated, without deleting them', async () => {
    await syncCategory(category([icon('calendar'), icon('tag')]));
    const tagId = sets().find((s) => s.name === 'objects/tag')!.id;
    const result = await deprecateMissing(['objects/calendar']);
    expect(result.moved).toEqual(['objects/tag']);
    const tag = sets().find((s) => s.name === 'objects/tag')!;
    expect(tag.id).toBe(tagId);
    expect(tag.parent!.name).toBe('Deprecated');
  });

  it('brings a set back from Deprecated with the same ids when the repo has it again', async () => {
    await syncCategory(category([icon('calendar'), icon('tag')]));
    await deprecateMissing(['objects/calendar']);
    const tag = sets().find((s) => s.name === 'objects/tag')!;
    const ids = [tag.id, ...tag.children.map((c) => c.id)];
    await syncCategory(category([icon('calendar'), icon('tag')]));
    const back = sets().find((s) => s.name === 'objects/tag')!;
    expect([back.id, ...back.children.map((c) => c.id)]).toEqual(ids);
    expect(back.parent!.name).toBe('Objects');
    await deprecateMissing(['objects/calendar', 'objects/tag']);
    const page = fake.pages().find((p) => p.name === 'Components')!;
    expect(page.children.some((n) => n.name === 'Deprecated')).toBe(false);
  });
});

describe('checkComponents', () => {
  it('counts sets, variants and problems on the Components page', async () => {
    await syncCategory({ id: 'navigation', label: 'Navigation', previousLabel: null, icons: [icon('home')] });
    await syncCategory(category([icon('calendar'), icon('tag')], 'Navigation'));
    expect(await checkComponents()).toMatchObject({
      sets: 3,
      variants: 9,
      unbound: 0,
      emptyVariants: 0,
      looseComponents: 0,
      sections: ['Navigation', 'Objects'],
    });
    const variant = sets().find((s) => s.name === 'objects/tag')!.children[0];
    variant.children[0].strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    sets()[0].children[2].children[0].remove();
    await fake.figma.setCurrentPageAsync(componentsPage());
    fake.figma.createComponent();
    expect(await checkComponents()).toMatchObject({ unbound: 1, emptyVariants: 1, looseComponents: 1 });
  });

  it('lists sections in canvas order and keeps the ids fingerprint across a re-sync', async () => {
    await syncCategory(category([icon('calendar'), icon('tag')]));
    await syncCategory({ id: 'navigation', label: 'Navigation', previousLabel: 'Objects', icons: [icon('home')] });
    expect((await checkComponents()).sections).toEqual(['Objects', 'Navigation']);
    componentsPage().children.find((n) => n.name === 'Navigation')!.y = -1000;
    const before = await checkComponents();
    expect(before.sections).toEqual(['Navigation', 'Objects']);
    expect(before.idsFingerprint).toMatch(/^[0-9a-f]{8}$/);
    await syncCategory(category([icon('calendar', OTHER_SVG), icon('tag')]));
    await syncCategory({ id: 'navigation', label: 'Navigation', previousLabel: 'Objects', icons: [icon('home')] });
    expect((await checkComponents()).idsFingerprint).toBe(before.idsFingerprint);
    await syncCategory(category([icon('calendar'), icon('tag'), icon('bell')]));
    expect((await checkComponents()).idsFingerprint).not.toBe(before.idsFingerprint);
  });
});

describe('gridPosition', () => {
  it('lays sets out in rows of six', () => {
    expect(gridPosition(0, 6)).toEqual({ x: 40, y: 64 });
    expect(gridPosition(7, 6)).toEqual({ x: 40 + 136, y: 64 + 72 });
  });
});

describe('fingerprint', () => {
  it('is 8 hex chars, stable, and sensitive to a one-character change', () => {
    const a = fingerprint({ d: 'M2.75 2.75' });
    expect(a).toMatch(/^[0-9a-f]{8}$/);
    expect(fingerprint({ d: 'M2.75 2.75' })).toBe(a);
    expect(fingerprint({ d: 'M2.75 2.5' })).not.toBe(a);
  });
});
