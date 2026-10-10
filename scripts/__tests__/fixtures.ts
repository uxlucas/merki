export const ROOT_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export const wrap = (body: string, rootAttrs = ROOT_ATTRS): string => `<svg ${rootAttrs}>${body}</svg>`;

export const HOME_SVG = wrap(
  '<path d="M2.75 6.5 8 2.25l5.25 4.25v6.25a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1Z"/>' +
    '<path d="M6.5 13.75V10.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v3.25"/>',
);

export const SEARCH_SVG = wrap('<circle cx="7" cy="7" r="4.5"/><path d="M10.25 10.25 13.75 13.75"/>');

export const meta = (category: string): string => JSON.stringify({ category, tags: [], aliases: [] });
