// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { icons } from '../data/icons';
import { clipboardSvg, copyText, downloadSvg, jsxSnippet, packageSvg } from './copy';

const pkgSvg = (name: string) => readFileSync(new NodeURL(`../../../packages/merki/svg/${name}.svg`, import.meta.url), 'utf8');

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('copy output', () => {
  it('matches the package SVG files byte for byte', () => {
    for (const icon of icons) {
      expect(packageSvg(icon.svg), icon.name).toBe(pkgSvg(icon.name));
      expect(clipboardSvg(icon.svg), icon.name).toBe(pkgSvg(icon.name).trimEnd());
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
