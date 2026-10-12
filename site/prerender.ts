import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface Rendered {
  html: string;
  head: string;
  status: number;
}

export interface PrerenderInput {
  distDir: string;
  paths: string[];
  render: (path: string) => Rendered;
  siteUrl: string;
}

export function outFile(distDir: string, path: string): string {
  if (path === '/') return join(distDir, 'index.html');
  if (path === '/404') return join(distDir, '404.html');
  return join(distDir, ...path.slice(1).split('/'), 'index.html');
}

export function fillTemplate(template: string, page: Rendered): string {
  if (!template.includes('<!--app-head-->') || !template.includes('<!--app-html-->')) {
    throw new Error('index.html is missing <!--app-head--> or <!--app-html-->');
  }
  // Function replacers: rendered HTML may contain "$&" and must be inserted as-is.
  return template.replace('<!--app-head-->', () => page.head).replace('<!--app-html-->', () => page.html);
}

export function sitemap(siteUrl: string, paths: string[]): string {
  const urls = paths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function prerender({ distDir, paths, render, siteUrl }: PrerenderInput): number {
  const template = readFileSync(join(distDir, 'index.html'), 'utf8');
  for (const path of [...paths, '/404']) {
    const page = render(path);
    const expected = path === '/404' ? 404 : 200;
    if (page.status !== expected) throw new Error(`${path} rendered with status ${page.status}, expected ${expected}`);
    const file = outFile(distDir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, fillTemplate(template, page));
  }
  writeFileSync(join(distDir, 'sitemap.xml'), sitemap(siteUrl, paths));
  return paths.length + 1;
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const server = (await import(pathToFileURL(join(here, 'dist-server', 'entry-server.js')).href)) as {
    render: (path: string) => Rendered;
    paths: string[];
    SITE_URL: string;
  };
  const count = prerender({ distDir: join(here, 'dist'), paths: server.paths, render: server.render, siteUrl: server.SITE_URL });
  console.log(`Prerendered ${count} pages.`);
}
