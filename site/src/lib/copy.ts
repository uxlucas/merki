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
