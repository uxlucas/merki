import { useEffect, useState } from 'react';
import type { ReviewEntry, ReviewUpdate } from './review';

interface Props {
  name: string;
  entry: ReviewEntry | undefined;
  available: boolean;
  onSave: (update: ReviewUpdate) => Promise<void>;
}

export function ReviewPanel({ name, entry, available, onSave }: Props) {
  const [note, setNote] = useState(entry?.note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');

  useEffect(() => {
    setNote(entry?.note ?? '');
    setState('idle');
  }, [name, entry?.note]);

  if (!available) {
    return (
      <section className="lab-section review" aria-label={`Review ${name}`}>
        <p className="muted">Review notes only work in the dev server: npm run dev:lab.</p>
      </section>
    );
  }

  const save = async (status: ReviewUpdate['status']) => {
    setState('saving');
    try {
      await onSave({ name, status, note });
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <section className="lab-section review" aria-label={`Review ${name}`}>
      <h2>
        Review · {name} {entry && <span className="badge" data-status={entry.status}>{entry.status}</span>}
      </h2>
      <label htmlFor="review-note">Note</label>
      <textarea
        id="review-note"
        rows={3}
        value={note}
        placeholder="e.g. reads heavier than calendar at 16"
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="review-actions">
        <button type="button" disabled={state === 'saving'} onClick={() => save('needs-work')}>
          Needs work
        </button>
        <button type="button" disabled={state === 'saving'} onClick={() => save('ok')}>
          Looks right
        </button>
        <button type="button" disabled={state === 'saving' || !entry} onClick={() => save('clear')}>
          Clear
        </button>
      </div>
      {state === 'error' && <p role="alert">Couldn't save. Is the dev server running?</p>}
    </section>
  );
}
