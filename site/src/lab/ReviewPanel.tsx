import { useEffect, useState } from 'react';
import type { ReviewEntry, ReviewUpdate } from './review';

export type ReviewState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'unavailable' }
  | { kind: 'error'; message: string };

interface Props {
  name: string;
  entry: ReviewEntry | undefined;
  review: ReviewState;
  onSave: (update: ReviewUpdate) => Promise<void>;
}

export function ReviewPanel({ name, entry, review, onSave }: Props) {
  const [note, setNote] = useState(entry?.note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setNote(entry?.note ?? '');
    setState('idle');
    setSaveError(null);
  }, [name, entry?.note]);

  if (review.kind !== 'ready') {
    const text =
      review.kind === 'loading'
        ? 'Loading notes…'
        : review.kind === 'error'
          ? `Review notes are unavailable: ${review.message}`
          : 'Review notes only work in the dev server: npm run dev:lab.';
    return (
      <section className="lab-section review" aria-label={`Review ${name}`}>
        <p className="muted">{text}</p>
      </section>
    );
  }

  const save = async (status: ReviewUpdate['status']) => {
    setState('saving');
    setSaveError(null);
    try {
      await onSave({ name, status, note });
      setState('idle');
    } catch (error) {
      setSaveError(error instanceof TypeError ? null : (error as Error).message);
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
      {state === 'error' && (
        <p role="alert">
          {saveError === null ? "Couldn't save. Is the dev server running?" : `Couldn't save: ${saveError}`}
        </p>
      )}
    </section>
  );
}
