import { describe, expect, it } from 'vitest';
import { paths, render } from './entry-server';

describe('render', () => {
  it('renders home', () => {
    const page = render('/');
    expect(page.status).toBe(200);
    expect(page.html).toContain('An icon library that');
    expect(page.head).toContain('<title>Merki · An icon library that obsesses over details</title>');
  });

  it('renders an icon page with its drawer open', () => {
    const page = render('/icons/calendar');
    expect(page.status).toBe(200);
    expect(page.html).toContain('aria-label="calendar icon"');
    expect(page.head).toContain('calendar icon · Merki');
  });

  it('renders not found for unknown icons with status 404', () => {
    const page = render('/icons/nope');
    expect(page.status).toBe(404);
    expect(page.html).toContain('There&#x27;s no icon called “nope”.');
  });

  it('renders guide pages', () => {
    expect(render('/guide/react').html).toContain('<h1>React</h1>');
  });

  it('renders the privacy page and links it from every page', () => {
    const privacy = render('/privacy');
    expect(privacy.status).toBe(200);
    expect(privacy.html).toContain('<h1>Privacy</h1>');
    expect(privacy.html).toContain('no cookies');
    expect(privacy.head).toContain('<title>Privacy · Merki</title>');
    for (const path of ['/', '/guide/react', '/icons/nope']) {
      const html = render(path).html;
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="https://github.com/uxlucas/merki/blob/main/LICENSE"');
    }
  });

  it('lists 164 pages', () => {
    expect(paths).toHaveLength(1 + 157 + 4 + 1 + 1);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
