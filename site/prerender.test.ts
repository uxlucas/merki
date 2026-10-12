import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fillTemplate, outFile, prerender, sitemap } from './prerender';

const TEMPLATE = '<html><head><!--app-head--></head><body><div id="root"><!--app-html--></div></body></html>';
let dir = '';
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

describe('prerender', () => {
  it('maps paths to files', () => {
    expect(outFile('/d', '/')).toBe(join('/d', 'index.html'));
    expect(outFile('/d', '/404')).toBe(join('/d', '404.html'));
    expect(outFile('/d', '/icons/calendar')).toBe(join('/d', 'icons', 'calendar', 'index.html'));
  });

  it('fills the template without treating $ in the html as a pattern', () => {
    expect(fillTemplate(TEMPLATE, { head: '<title>t</title>', html: '<p>$&$1</p>', status: 200 })).toBe(
      '<html><head><title>t</title></head><body><div id="root"><p>$&$1</p></div></body></html>',
    );
    expect(() => fillTemplate('<html></html>', { head: '', html: '', status: 200 })).toThrow(/app-head/);
  });

  it('writes every page, the 404 page and a sitemap', () => {
    dir = mkdtempSync(join(tmpdir(), 'merki-prerender-'));
    writeFileSync(join(dir, 'index.html'), TEMPLATE);
    const render = (path: string) => ({ html: `<p>${path}</p>`, head: '', status: path === '/404' ? 404 : 200 });
    const count = prerender({ distDir: dir, paths: ['/', '/icons/calendar'], render, siteUrl: 'https://x.test' });
    expect(count).toBe(3);
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('<p>/</p>');
    expect(readFileSync(join(dir, 'icons', 'calendar', 'index.html'), 'utf8')).toContain('<p>/icons/calendar</p>');
    expect(readFileSync(join(dir, '404.html'), 'utf8')).toContain('<p>/404</p>');
    expect(readFileSync(join(dir, 'sitemap.xml'), 'utf8')).toBe(sitemap('https://x.test', ['/', '/icons/calendar']));
  });

  it('stops when a page renders with the wrong status', () => {
    dir = mkdtempSync(join(tmpdir(), 'merki-prerender-'));
    writeFileSync(join(dir, 'index.html'), TEMPLATE);
    const render = () => ({ html: '', head: '', status: 404 });
    expect(() => prerender({ distDir: dir, paths: ['/'], render, siteUrl: 'https://x.test' })).toThrow(/\/ rendered with status 404/);
  });
});
