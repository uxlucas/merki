import { describe, expect, it } from 'vitest';
import { applyReview, parseReviewFile } from './review';

const NOW = new Date('2026-10-10T12:00:00.000Z');

describe('parseReviewFile', () => {
  it('treats a missing or empty file as no reviews', () => {
    expect(parseReviewFile(null)).toEqual({});
    expect(parseReviewFile('  \n')).toEqual({});
  });

  it('refuses to parse broken JSON instead of resetting it', () => {
    expect(() => parseReviewFile('{ "home": ')).toThrow();
    expect(() => parseReviewFile('[]')).toThrow(/must be an object/);
  });
});

describe('applyReview', () => {
  it('adds and updates entries with a trimmed note and timestamp', () => {
    const first = applyReview({}, { name: 'bell', status: 'needs-work', note: '  0.5px too wide  ' }, NOW);
    expect(first).toEqual({ bell: { status: 'needs-work', note: '0.5px too wide', updatedAt: NOW.toISOString() } });

    const second = applyReview(first, { name: 'bell', status: 'ok' }, NOW);
    expect(second.bell).toEqual({ status: 'ok', note: '', updatedAt: NOW.toISOString() });
  });

  it('clears an entry and leaves the rest alone', () => {
    const current = {
      bell: { status: 'ok' as const, note: '', updatedAt: 'a' },
      home: { status: 'needs-work' as const, note: 'x', updatedAt: 'b' },
    };
    expect(applyReview(current, { name: 'bell', status: 'clear' }, NOW)).toEqual({ home: current.home });
  });

  it('does not mutate the current object', () => {
    const current = {};
    applyReview(current, { name: 'bell', status: 'ok' }, NOW);
    expect(current).toEqual({});
  });

  it('rejects bad names and statuses', () => {
    expect(() => applyReview({}, { name: '../etc', status: 'ok' }, NOW)).toThrow(/invalid icon name/);
    expect(() => applyReview({}, { name: '2fa', status: 'ok' }, NOW)).toThrow(/invalid icon name/);
    expect(() => applyReview({}, { name: 'bell', status: 'maybe' as 'ok' }, NOW)).toThrow(/invalid status/);
  });
});
