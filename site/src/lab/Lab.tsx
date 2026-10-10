import { useEffect, useState } from 'react';
import { Compare } from './Compare';
import { GridView } from './GridView';
import { Ladder } from './Ladder';
import { MenuMock } from './MenuMock';
import type { ReviewFile, ReviewUpdate } from './review';
import { ReviewPanel } from './ReviewPanel';
import type { LabIcon } from './types';

interface Props {
  icons: LabIcon[];
  fetchImpl?: typeof fetch;
}

export function Lab({ icons, fetchImpl = globalThis.fetch }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selected, setSelected] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewFile>({});
  const [reviewsAvailable, setReviewsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchImpl('/__lab/review')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: ReviewFile) => {
        if (cancelled) return;
        setReviews(data);
        setReviewsAvailable(true);
      })
      .catch(() => {
        if (!cancelled) setReviewsAvailable(false);
      });
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
    if (!res.ok) throw new Error(`save failed: ${res.status}`);
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
          {icons.length} icons{reviewsAvailable ? ` · ${flagged} need work` : ''}
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
              <ReviewPanel name={target.name} entry={reviews[target.name]} available={reviewsAvailable} onSave={saveReview} />
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
