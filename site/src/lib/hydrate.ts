import { normalizePath } from './routes';

/**
 * Whether the client should hydrate what is already in the root.
 * The bare dev template has no element to hydrate. The prerendered 404 page is served at any
 * unknown path (/icons/nope), so its markup can differ from what the client renders there.
 * Every page marks the path it was rendered for (data-path); if a host serves a different page
 * than the URL asks for, the client renders from scratch instead of hydrating a mismatch.
 */
export function shouldHydrate(root: Element, pathname: string): boolean {
  if (root.firstElementChild === null || root.querySelector('[data-notfound]') !== null) return false;
  return root.querySelector('[data-path]')?.getAttribute('data-path') === normalizePath(pathname);
}
