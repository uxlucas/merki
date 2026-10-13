import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../figma/core.js';
import { requireSets, variantOf } from '../figma/pages.js';
import { createFakeFigma } from './fake-figma.js';

beforeEach(async () => {
  const fake = createFakeFigma();
  Object.assign(globalThis, { figma: fake.figma, ...core });
  await core.ensurePages();
  await core.syncCategory({ id: 'objects', label: 'Objects', previousLabel: null, icons: [{ name: 'calendar', category: 'objects', setName: 'objects/calendar', description: '', svg: '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>' }] });
});

describe('presentation pages', () => {
  it('finds a variant by size', async () => {
    const page = core.pageByName('Components');
    const set = page.findAllWithCriteria({ types: ['COMPONENT_SET'] })[0];
    expect(variantOf(set, 24).name).toBe('Size=24');
    expect(() => variantOf(set, 32)).toThrow(/Size=32/);
  });

  it('refuses to build a page when a set is missing, naming it, before touching the page', async () => {
    const page = core.pageByName('Components');
    const sets = new Map<string, any>(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s: any) => [s.name, s] as [string, any]));
    expect(() => requireSets(sets, ['objects/calendar', 'objects/nope'])).toThrow(/objects\/nope/);
    expect(() => requireSets(sets, ['objects/calendar'])).not.toThrow();
  });
});
