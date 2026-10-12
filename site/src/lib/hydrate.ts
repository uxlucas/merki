/**
 * Whether the client should hydrate what is already in the root.
 * The bare dev template has no element to hydrate. The prerendered 404 page is served at any
 * unknown path (/icons/nope), so its markup can differ from what the client renders there.
 */
export function shouldHydrate(root: Element): boolean {
  return root.firstElementChild !== null && root.querySelector('[data-notfound]') === null;
}
