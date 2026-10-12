import { useCallback, useEffect, useState } from 'react';

/** Copies text. Resolves true only when something was actually copied. */
export async function copyText(
  text: string,
  nav: Navigator | undefined = globalThis.navigator,
  doc: Document | undefined = globalThis.document,
): Promise<boolean> {
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Denied or unavailable: try the fallback below.
  }
  if (!doc) return false;
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  doc.body.append(area);
  area.select();
  try {
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export type CopyState = 'idle' | 'copied' | 'failed';

export function useCopy(): { state: CopyState; copy: (text: string) => Promise<void> } {
  const [state, setState] = useState<CopyState>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 1200);
    return () => clearTimeout(timer);
  }, [state]);
  const copy = useCallback(async (text: string) => setState((await copyText(text)) ? 'copied' : 'failed'), []);
  return { state, copy };
}

/** The exact contents of packages/merki/svg/<name>.svg (mirrors withSize in scripts/lib/optimize.ts, plus its trailing newline). */
export const packageSvg = (svg: string): string => `${svg.replace(/^<svg\b/, '<svg width="16" height="16"')}\n`;

/** What Copy SVG puts on the clipboard: the package file without its trailing newline. */
export const clipboardSvg = (svg: string): string => packageSvg(svg).trimEnd();

export const jsxSnippet = (component: string): string => `<${component} />`;

export function downloadSvg(name: string, contents: string, doc: Document = document, url: typeof URL = URL): void {
  const href = url.createObjectURL(new Blob([contents], { type: 'image/svg+xml' }));
  const anchor = doc.createElement('a');
  anchor.href = href;
  anchor.download = `${name}.svg`;
  doc.body.append(anchor);
  anchor.click();
  anchor.remove();
  url.revokeObjectURL(href);
}
