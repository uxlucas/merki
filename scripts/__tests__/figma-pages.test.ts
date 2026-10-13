import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../figma/core.js';
import { buildChangelog, buildConstruction, buildCover, buildIconsPage, requireSets, variantOf } from '../figma/pages.js';
import { createFakeFigma, type FakeFigma } from './fake-figma.js';

let fake: FakeFigma;
beforeEach(async () => {
  fake = createFakeFigma();
  Object.assign(globalThis, { figma: fake.figma, ...core });
  await core.ensurePages();
  await core.syncCategory({ id: 'objects', label: 'Objects', previousLabel: null, icons: [{ name: 'calendar', category: 'objects', setName: 'objects/calendar', docsUrl: 'https://merki.lucaslima.design/icons/calendar', description: '', svg: '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>' }] });
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
    expect((await buildIconsPage({ url: 'merki.lucaslima.design', categories: [{ label: 'Objects', setNames: ['objects/calendar'] }] })).fonts).toEqual(inter);
    expect((await buildCover({ count: 1, url: 'merki.lucaslima.design', markSvg: '<svg/>', wall: ['objects/calendar'], highlight: [] })).fonts).toEqual(inter);
    expect((await buildConstruction({ examples: ['objects/calendar'] })).fonts).toEqual(inter);
    expect((await buildChangelog([{ type: 'h', level: 1, text: 'Changelog' }])).fonts).toEqual(inter);
    fake.fonts.push({ family: 'Host Grotesk', style: 'Medium' });
    expect((await buildChangelog([])).fonts.head).toEqual({ family: 'Host Grotesk', style: 'Medium' });
  });

  it('heads the Icons page with the name and the site address, above the cards', async () => {
    const built = await buildIconsPage({ url: 'merki.lucaslima.design', categories: [{ label: 'Objects', setNames: ['objects/calendar'] }] });
    const column = core.pageByName('Icons').children.find((n: any) => n.id === built.column);
    const [header, card] = column.children;
    expect(header.name).toBe('Header');
    expect(header.layoutMode).toBe('VERTICAL');
    expect(header.itemSpacing).toBe(6);
    expect(header.children.map((n: any) => n.characters)).toEqual(['Merki Icons', 'merki.lucaslima.design']);
    expect(header.children.map((n: any) => n.fontSize)).toEqual([32, 14]);
    expect(card.name).toBe('Objects');
  });

  it('puts the site address under the facts on the cover, clear of the wall', async () => {
    const built = await buildCover({ count: 1, url: 'merki.lucaslima.design', markSvg: '<svg/>', wall: ['objects/calendar'], highlight: [] });
    const cover = core.pageByName('Cover').children.find((n: any) => n.id === built.cover);
    const [facts, url] = cover.findAll((n: any) => n.type === 'TEXT').filter((n: any) => /icons ·|lucaslima/.test(n.characters));
    expect(url.characters).toBe('merki.lucaslima.design');
    expect(url.fontSize).toBe(20);
    expect(url.fills[0].color).toEqual(core.hex('#a1a1aa'));
    expect(url.fontName).toEqual(facts.fontName);
    expect(url.y).toBe(facts.y + facts.height + 16);
    expect(url.y + url.height).toBeLessThanOrEqual(600);
  });

  it('writes changelog text without markdown: bold, code and links', async () => {
    await buildChangelog([
      { type: 'p', text: 'See **the** [site](https://merki.dev) for `npm i merki-icons`.' },
      { type: 'ul', items: ['[Docs](https://merki.dev/docs) and [GitHub](https://github.com/x/y)'] },
    ]);
    expect(texts('Changelog')).toEqual(['See the site for npm i merki-icons.', '•  Docs and GitHub']);
  });
});
