import { describe, expect, it } from 'vitest';
import { allPaths, headFor, headTags, matchRoute, normalizePath } from './routes';

const names = new Set(['calendar', 'arrow-up']);

describe('normalizePath', () => {
  it('drops trailing slashes, queries and hashes', () => {
    expect(normalizePath('/icons/calendar/')).toBe('/icons/calendar');
    expect(normalizePath('/guide/react?x=1#props')).toBe('/guide/react');
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('matchRoute', () => {
  it('matches every page kind', () => {
    expect(matchRoute('/', names)).toEqual({ kind: 'home' });
    expect(matchRoute('/icons/calendar', names)).toEqual({ kind: 'icon', name: 'calendar' });
    expect(matchRoute('/icons/arrow-up/', names)).toEqual({ kind: 'icon', name: 'arrow-up' });
    expect(matchRoute('/guide/react', names)).toEqual({ kind: 'guide', slug: 'react' });
    expect(matchRoute('/changelog', names)).toEqual({ kind: 'changelog' });
  });

  it('sends anything else to not found', () => {
    expect(matchRoute('/icons/nope', names)).toEqual({ kind: 'notfound', missingIcon: 'nope' });
    expect(matchRoute('/icons/', names)).toEqual({ kind: 'notfound' });
    expect(matchRoute('/guide/x', names)).toEqual({ kind: 'notfound' });
    expect(matchRoute('/lab', names)).toEqual({ kind: 'notfound' });
    expect(matchRoute('/404', names)).toEqual({ kind: 'notfound' });
  });
});

describe('allPaths', () => {
  it('lists home, each icon, the guide and the changelog once', () => {
    expect(allPaths(['calendar', 'arrow-up'])).toEqual([
      '/',
      '/icons/calendar',
      '/icons/arrow-up',
      '/guide/install',
      '/guide/react',
      '/guide/svg',
      '/guide/accessibility',
      '/changelog',
    ]);
  });
});

describe('headFor / headTags', () => {
  it('writes a title, description and canonical url per page', () => {
    const home = headFor({ kind: 'home' }, '/', 157, 'https://x.test');
    expect(home.title).toBe('Merki · 157 icons for software people use all day');
    expect(home.canonical).toBe('https://x.test/');
    const icon = headFor({ kind: 'icon', name: 'calendar' }, '/icons/calendar/', 157, 'https://x.test');
    expect(icon.title).toBe('calendar icon · Merki');
    expect(icon.canonical).toBe('https://x.test/icons/calendar');
    expect(headFor({ kind: 'notfound' }, '/x', 157, 'https://x.test').title).toBe('Not found · Merki');
  });

  it('escapes what it writes into HTML', () => {
    const tags = headTags({ title: 'a<b', description: '"q" & r', canonical: 'https://x.test/' });
    expect(tags).toContain('<title>a&lt;b</title>');
    expect(tags).toContain('content="&quot;q&quot; &amp; r"');
    expect(tags).toContain('<link rel="canonical" href="https://x.test/">');
  });
});
