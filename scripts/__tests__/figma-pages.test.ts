import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../figma/core.js';
import { buildChangelog, buildConstruction, buildCover, buildIconsPage, requireSets, variantOf } from '../figma/pages.js';
import { createFakeFigma, type FakeFigma } from './fake-figma.js';

let fake: FakeFigma;
beforeEach(async () => {
  fake = createFakeFigma();
  Object.assign(globalThis, { figma: fake.figma, ...core });
  await core.ensurePages();
  await core.syncCategory({ id: 'objects', label: 'Objects', previousLabel: null, icons: [{ name: 'calendar', category: 'objects', setName: 'objects/calendar', description: '', svg: '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>' }] });
});

const texts = (pageName: string) =>
  core
    .pageByName(pageName)
    .findAll((n: any) => n.type === 'TEXT')
    .map((n: any) => n.characters);

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

  it('reports the fonts each page used, so a fallback to Inter shows', async () => {
    const inter = { head: { family: 'Inter', style: 'Medium' }, mono: { family: 'Inter', style: 'Regular' }, monoMedium: { family: 'Inter', style: 'Medium' }, text: { family: 'Inter', style: 'Regular' } };
    expect((await buildIconsPage([{ label: 'Objects', setNames: ['objects/calendar'] }])).fonts).toEqual(inter);
    expect((await buildCover({ count: 1, markSvg: '<svg/>', wall: ['objects/calendar'], highlight: [] })).fonts).toEqual(inter);
    expect((await buildConstruction({ examples: ['objects/calendar'] })).fonts).toEqual(inter);
    expect((await buildChangelog([{ type: 'h', level: 1, text: 'Changelog' }])).fonts).toEqual(inter);
    fake.fonts.push({ family: 'Host Grotesk', style: 'Medium' });
    expect((await buildChangelog([])).fonts.head).toEqual({ family: 'Host Grotesk', style: 'Medium' });
  });

  it('writes changelog text without markdown: bold, code and links', async () => {
    await buildChangelog([
      { type: 'p', text: 'See **the** [site](https://merki.dev) for `npm i merki-icons`.' },
      { type: 'ul', items: ['[Docs](https://merki.dev/docs) and [GitHub](https://github.com/x/y)'] },
    ]);
    expect(texts('Changelog')).toEqual(['See the site for npm i merki-icons.', '•  Docs and GitHub']);
  });
});
