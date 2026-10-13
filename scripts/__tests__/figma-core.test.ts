import { beforeEach, describe, expect, it } from 'vitest';
import { deprecateMissing, ensureIconVariable, ensurePages, gridPosition, syncCategory } from '../figma/core.js';
import { createFakeFigma, type FakeFigma } from './fake-figma.js';

let fake: FakeFigma;
beforeEach(async () => {
  fake = createFakeFigma();
  (globalThis as any).figma = fake.figma;
  await ensurePages();
});

const icon = (name: string, svg = '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>') => ({
  name,
  category: 'objects',
  setName: `objects/${name}`,
  description: `React: <${name}Icon />`,
  svg,
});
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
    expect(set.description).toBe('React: <calendarIcon />');
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
    const result = await syncCategory(category([icon('calendar', '<svg width="16" height="16"><path d="M2 2" stroke="#000000"/></svg>')]));
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

describe('gridPosition', () => {
  it('lays sets out in rows of six', () => {
    expect(gridPosition(0, 6)).toEqual({ x: 40, y: 64 });
    expect(gridPosition(7, 6)).toEqual({ x: 40 + 136, y: 64 + 72 });
  });
});
