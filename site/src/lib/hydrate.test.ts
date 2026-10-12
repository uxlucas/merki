// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { shouldHydrate } from './hydrate';

function rootWith(html: string): Element {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

const page = (path: string) => `<div class="index" data-path="${path}"><main><h1>Changelog</h1></main></div>`;

describe('shouldHydrate', () => {
  it('hydrates a prerendered page that was rendered for this path', () => {
    expect(shouldHydrate(rootWith(page('/changelog')), '/changelog')).toBe(true);
    expect(shouldHydrate(rootWith(page('/')), '/')).toBe(true);
  });

  it('compares normalized paths, so a trailing slash or query does not matter', () => {
    expect(shouldHydrate(rootWith(page('/changelog')), '/changelog/')).toBe(true);
    expect(shouldHydrate(rootWith(page('/icons/heart')), '/icons/heart?x=1')).toBe(true);
  });

  it('renders from scratch when the host served a different page than the URL asks for', () => {
    expect(shouldHydrate(rootWith(page('/')), '/changelog')).toBe(false);
    expect(shouldHydrate(rootWith(page('/icons/heart')), '/icons/star')).toBe(false);
  });

  it('renders from scratch when the page carries no path marker', () => {
    expect(shouldHydrate(rootWith('<main><h1>Changelog</h1></main>'), '/changelog')).toBe(false);
  });

  it('renders from scratch over the shared 404 page, which can be served at any path', () => {
    expect(shouldHydrate(rootWith('<div data-path="/icons/nope"><main data-notfound=""><h1>No page here.</h1></main></div>'), '/icons/nope')).toBe(false);
  });

  it('renders from scratch over the bare dev template', () => {
    expect(shouldHydrate(rootWith('<!--app-html-->'), '/')).toBe(false);
    expect(shouldHydrate(rootWith(''), '/')).toBe(false);
  });
});
