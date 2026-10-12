// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { icons } from '../data/icons';
import { DEFAULT_LOOK, copyText, customSvg, downloadSvg, isDefaultLook, jsxSnippet } from './copy';

const pkgSvg = (name: string) => readFileSync(new NodeURL(`../../../packages/merki/svg/${name}.svg`, import.meta.url), 'utf8');

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('copy output', () => {
  it('matches the package SVG files byte for byte', () => {
    for (const icon of icons) {
      expect(customSvg(icon.svg, DEFAULT_LOOK), icon.name).toBe(pkgSvg(icon.name));
      expect(customSvg(icon.svg, DEFAULT_LOOK).trimEnd(), icon.name).toBe(pkgSvg(icon.name).trimEnd());
    }
  });

  it('writes JSX with the export name', () => {
    expect(jsxSnippet('CalendarIcon')).toBe('<CalendarIcon />');
  });
});

describe('copyText', () => {
  it('uses the clipboard API', async () => {
    const writeText = vi.fn(async () => {});
    expect(await copyText('x', { clipboard: { writeText } } as unknown as Navigator, document)).toBe(true);
    expect(writeText).toHaveBeenCalledWith('x');
  });

  it('falls back to execCommand when the clipboard API is denied', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('denied');
    });
    document.execCommand = vi.fn(() => true);
    expect(await copyText('x', { clipboard: { writeText } } as unknown as Navigator, document)).toBe(true);
  });

  it('reports failure when nothing works', async () => {
    document.execCommand = vi.fn(() => {
      throw new Error('nope');
    });
    expect(await copyText('x', {} as Navigator, document)).toBe(false);
    document.execCommand = vi.fn(() => false);
    expect(await copyText('x', {} as Navigator, document)).toBe(false);
  });
});

describe('downloadSvg', () => {
  it('saves <name>.svg with the given contents', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:x');
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadSvg('calendar', '<svg/>', document, { createObjectURL, revokeObjectURL } as unknown as typeof URL);
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe('image/svg+xml');
    expect(click).toHaveBeenCalled();
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('calendar.svg');
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});

describe('copy what you see', () => {
  const calendar = icons.find((i) => i.name === 'calendar')!;

  it('is the package file when nothing changed', () => {
    expect(customSvg(calendar.svg, DEFAULT_LOOK)).toBe(pkgSvg('calendar'));
    expect(jsxSnippet('CalendarIcon', DEFAULT_LOOK)).toBe('<CalendarIcon />');
  });

  it('carries the size and colour, including solid accents', () => {
    const out = customSvg(calendar.svg, { color: '#2563eb', size: 24 });
    expect(out.startsWith('<svg width="24" height="24" ')).toBe(true);
    expect(out).not.toContain('currentColor');
    expect(out.match(/#2563eb/g)!.length).toBe(calendar.svg.match(/currentColor/g)!.length);
    expect(out.endsWith('\n')).toBe(true);
  });

  it('can change only one of them', () => {
    expect(customSvg(calendar.svg, { color: null, size: 32 })).toContain('currentColor');
    expect(customSvg(calendar.svg, { color: null, size: 32 }).startsWith('<svg width="32" height="32" ')).toBe(true);
    expect(jsxSnippet('CalendarIcon', { color: null, size: 32 })).toBe('<CalendarIcon size={32} />');
    expect(jsxSnippet('CalendarIcon', { color: '#16a34a', size: 16 })).toBe('<CalendarIcon color="#16a34a" />');
    expect(jsxSnippet('CalendarIcon', { color: '#16a34a', size: 40 })).toBe('<CalendarIcon size={40} color="#16a34a" />');
  });

  it('knows the default look', () => {
    expect(isDefaultLook(DEFAULT_LOOK)).toBe(true);
    expect(isDefaultLook({ color: null, size: 20 })).toBe(false);
    expect(isDefaultLook({ color: '#e11d48', size: 16 })).toBe(false);
  });
});
