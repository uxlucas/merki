import { CheckIcon, type MerkiIcon } from 'merki-icons';
import { useCopy } from '../lib/copy';

export function CopyButton({ text, label, icon: Glyph, className = 'action' }: { text: string; label: string; icon: MerkiIcon; className?: string }) {
  const { state, copy } = useCopy();
  return (
    <button type="button" className={className} onClick={() => copy(text)}>
      <span className="swap" data-state={state === 'copied' ? 'copied' : 'idle'} aria-hidden="true">
        <Glyph size={14} className="swap-a" />
        <CheckIcon size={14} className="swap-b" />
      </span>
      <span>{state === 'failed' ? "Couldn't copy" : label}</span>
      <span className="sr-only" aria-live="polite">{state === 'copied' ? 'Copied' : ''}</span>
    </button>
  );
}
