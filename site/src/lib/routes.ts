export const GUIDE_PAGES = [
  { slug: 'install', title: 'Install', description: 'Install merki-icons from npm, pnpm, yarn or bun.' },
  { slug: 'react', title: 'React', description: 'The Merki React components: size, color, absoluteStrokeWidth and title.' },
  { slug: 'svg', title: 'SVG', description: 'Use Merki without React: plain currentColor SVGs, copied, downloaded or taken from the package.' },
  { slug: 'accessibility', title: 'Accessibility', description: 'Merki icons are decorative by default. How to name them, and how to label icon-only buttons.' },
] as const;

export type GuideSlug = (typeof GUIDE_PAGES)[number]['slug'];

export type Route =
  | { kind: 'home' }
  | { kind: 'icon'; name: string }
  | { kind: 'guide'; slug: GuideSlug }
  | { kind: 'changelog' }
  | { kind: 'privacy' }
  | { kind: 'notfound'; missingIcon?: string };

export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] || '/';
  if (clean === '/') return clean;
  return clean.replace(/\/+$/, '') || '/';
}

export function matchRoute(path: string, names: { has(name: string): boolean }): Route {
  const p = normalizePath(path);
  if (p === '/') return { kind: 'home' };
  if (p === '/changelog') return { kind: 'changelog' };
  if (p === '/privacy') return { kind: 'privacy' };
  const icon = /^\/icons\/([a-z0-9-]+)$/.exec(p);
  if (icon) return names.has(icon[1]) ? { kind: 'icon', name: icon[1] } : { kind: 'notfound', missingIcon: icon[1] };
  const guide = /^\/guide\/([a-z-]+)$/.exec(p);
  const page = guide ? GUIDE_PAGES.find((g) => g.slug === guide[1]) : undefined;
  if (page) return { kind: 'guide', slug: page.slug };
  return { kind: 'notfound' };
}

export function allPaths(names: Iterable<string>): string[] {
  return ['/', ...[...names].map((name) => `/icons/${name}`), ...GUIDE_PAGES.map((g) => `/guide/${g.slug}`), '/changelog', '/privacy'];
}

export interface Head {
  title: string;
  description: string;
  canonical: string;
}

const HOME_DESCRIPTION =
  'merki-icons is a growing collection of bold, rounded icons for Figma and code. Open source and free to use under the MIT License.';

export function headFor(route: Route, path: string, count: number, siteUrl: string): Head {
  const p = normalizePath(path);
  const canonical = `${siteUrl}${p}`;
  switch (route.kind) {
    case 'home':
      return { title: 'Merki · An icon library that obsesses over details', description: HOME_DESCRIPTION, canonical };
    case 'icon':
      return {
        title: `${route.name} icon · Merki`,
        description: `The ${route.name} icon from Merki, drawn on a 16px grid with one stroke. Copy the SVG or the React component. MIT.`,
        canonical,
      };
    case 'guide': {
      const page = GUIDE_PAGES.find((g) => g.slug === route.slug)!;
      return { title: `${page.title} · Merki guide`, description: page.description, canonical };
    }
    case 'changelog':
      return { title: 'Changelog · Merki', description: 'What changed in Merki, release by release.', canonical };
    case 'privacy':
      return { title: 'Privacy · Merki', description: 'What this site keeps and who sees your visit: no cookies, no analytics.', canonical };
    case 'notfound':
      return { title: 'Not found · Merki', description: 'There is no page here.', canonical };
  }
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function headTags(head: Head): string {
  const title = escapeHtml(head.title);
  const description = escapeHtml(head.description);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${escapeHtml(head.canonical)}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${escapeHtml(head.canonical)}">`,
  ].join('\n    ');
}
