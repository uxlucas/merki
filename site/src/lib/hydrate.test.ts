// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { shouldHydrate } from './hydrate';

function rootWith(html: string): Element {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('shouldHydrate', () => {
  it('hydrates a prerendered page', () => {
    expect(shouldHydrate(rootWith('<main><h1>Changelog</h1></main>'))).toBe(true);
  });

  it('renders from scratch over the shared 404 page, which can be served at any path', () => {
    expect(shouldHydrate(rootWith('<main data-notfound=""><h1>No page here.</h1></main>'))).toBe(false);
  });

  it('renders from scratch over the bare dev template', () => {
    expect(shouldHydrate(rootWith('<!--app-html-->'))).toBe(false);
    expect(shouldHydrate(rootWith(''))).toBe(false);
  });
});
