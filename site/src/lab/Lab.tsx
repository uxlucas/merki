import { useEffect, useState } from 'react';
import { Compare } from './Compare';
import { GridView } from './GridView';
import { Ladder } from './Ladder';
import { MenuMock } from './MenuMock';
import type { ReviewFile, ReviewUpdate } from './review';
import { ReviewPanel, type ReviewState } from './ReviewPanel';
import type { LabIcon } from './types';

interface Props {
  icons: LabIcon[];
  fetchImpl?: typeof fetch;
}

/** The dev endpoint answers failures with { error: string }. A static build's 404 has no such body. */
async function serverError(res: Response): Promise<string | null> {
  try {
    const body: unknown = await res.json();
    const message = (body as { error?: unknown } | null)?.error;
    return typeof message === 'string' ? message : null;
  } catch {
    return null;
  }
}

export function Lab({ icons, fetchImpl = globalThis.fetch }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selected, setSelected] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewFile>({});
  const [review, setReview] = useState<ReviewState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchImpl('/__lab/review');
        if (res.ok) {
          const data = (await res.json()) as ReviewFile;
          if (cancelled) return;
          setReviews(data);
          setReview({ kind: 'ready' });
          return;
        }
        const message = await serverError(res);
        if (!cancelled) setReview(message === null ? { kind: 'unavailable' } : { kind: 'error', message });
      } catch {
        if (!cancelled) setReview({ kind: 'unavailable' });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchImpl]);

  const saveReview = async (update: ReviewUpdate) => {
    const res = await fetchImpl('/__lab/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error((await serverError(res)) ?? `save failed: ${res.status}`);
    setReviews((await res.json()) as ReviewFile);
  };

  const target = icons.find((icon) => icon.name === selected) ?? null;
  const flagged = Object.values(reviews).filter((entry) => entry.status === 'needs-work').length;

  return (
    <div className="lab" data-theme={theme}>
      <header className="lab-header">
        <h1>
          merki <span>/lab</span>
        </h1>
        <p>
          {icons.length} icons{review.kind === 'ready' ? ` · ${flagged} need work` : ''}
        </p>
        <button type="button" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      {icons.length === 0 ? (
        <p className="muted">No icons yet. Add name.svg and name.json to icons/ and this page reloads.</p>
      ) : (
        <>
          {target && (
            <div className="focus">
              <Compare target={target} icons={icons} />
              <ReviewPanel name={target.name} entry={reviews[target.name]} review={review} onSave={saveReview} />
            </div>
          )}
          <Ladder icons={icons} selected={selected} reviews={reviews} onSelect={setSelected} />
          <GridView icons={icons} onSelect={setSelected} />
          <MenuMock icons={icons} />
        </>
      )}
    </div>
  );
}
