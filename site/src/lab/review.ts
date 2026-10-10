export type ReviewStatus = 'needs-work' | 'ok';

export interface ReviewEntry {
  status: ReviewStatus;
  note: string;
  updatedAt: string;
}

export type ReviewFile = Record<string, ReviewEntry>;

export interface ReviewUpdate {
  name: string;
  status: ReviewStatus | 'clear';
  note?: string;
}

const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['needs-work', 'ok', 'clear']);

export function parseReviewFile(text: string | null): ReviewFile {
  if (text === null || text.trim() === '') return {};
  const data: unknown = JSON.parse(text);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('_review.json must be an object of { name: { status, note, updatedAt } }');
  }
  const entries = Object.entries(data as Record<string, unknown>).filter(([, entry]) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const status = (entry as { status?: unknown }).status;
    return status === 'needs-work' || status === 'ok';
  });
  return Object.fromEntries(entries) as ReviewFile;
}

export function applyReview(current: ReviewFile, update: ReviewUpdate, now: Date): ReviewFile {
  if (typeof update?.name !== 'string' || !NAME.test(update.name)) {
    throw new Error(`invalid icon name: ${String(update?.name)}`);
  }
  if (!STATUSES.has(update.status)) throw new Error(`invalid status: ${String(update.status)}`);

  const next = { ...current };
  if (update.status === 'clear') {
    delete next[update.name];
    return next;
  }
  next[update.name] = { status: update.status, note: (update.note ?? '').trim(), updatedAt: now.toISOString() };
  return next;
}
