import { CheckIcon, type MerkiIcon } from 'merki-icons';
import { useCopy } from '../lib/copy';

export function CopyButton({ text, label, icon: Glyph, className = 'action' }: { text: string; label: string; icon: MerkiIcon; className?: string }) {
  const { state, copy } = useCopy();
  return (
    <button type="button" className={className} onClick={() => copy(text)}>
      {state === 'copied' ? <CheckIcon size={14} /> : <Glyph size={14} />}
      <span>{state === 'failed' ? "Couldn't copy" : label}</span>
      <span className="sr-only" aria-live="polite">{state === 'copied' ? 'Copied' : ''}</span>
    </button>
  );
}
