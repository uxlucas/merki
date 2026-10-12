import { useEffect, useState } from 'react';
import { CategoryChips } from './CategoryChips';
import { Compare } from './Compare';
import { GridView } from './GridView';
import { Ladder } from './Ladder';
import { MenuMock } from './MenuMock';
import type { ReviewFile, ReviewUpdate } from './review';
import { ReviewPanel, type ReviewState } from './ReviewPanel';
import { CATEGORY_ORDER, type LabIcon } from './types';

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
  const [category, setCategory] = useState<string | null>(null);
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

  const categoryOf = (icon: LabIcon) => icon.meta?.category ?? 'uncategorized';
  const counts: Record<string, number> = {};
  for (const icon of icons) counts[categoryOf(icon)] = (counts[categoryOf(icon)] ?? 0) + 1;
  const rank = (name: string) => {
    if (name === 'uncategorized') return CATEGORY_ORDER.length + 1;
    const index = (CATEGORY_ORDER as readonly string[]).indexOf(name);
    return index === -1 ? CATEGORY_ORDER.length : index;
  };
  const categories = Object.keys(counts).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const visible = category === null ? icons : icons.filter((icon) => categoryOf(icon) === category);

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
          <CategoryChips categories={categories} selected={category} counts={counts} onSelect={setCategory} />
          <div className="lab-body">
            <main className="lab-main">
              <Ladder icons={visible} selected={selected} reviews={reviews} onSelect={setSelected} />
              <GridView icons={visible} onSelect={setSelected} />
              <MenuMock icons={visible} />
            </main>
            {target && (
              <aside className="lab-aside">
                <Compare target={target} icons={icons} />
                <ReviewPanel name={target.name} entry={reviews[target.name]} review={review} onSave={saveReview} />
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
