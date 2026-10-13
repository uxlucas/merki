import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const icons = fileURLToPath(new URL('../../icons', import.meta.url));
const has = (name: string, ext: 'svg' | 'json') => existsSync(`${icons}/${name}.${ext}`);

const renames: [old: string, next: string][] = [
  ['user-circle', 'circle-user'],
  ['info', 'circle-info'],
  ['help', 'circle-help'],
  ['list-bullet', 'list-unordered'],
  ['expand', 'maximize'],
  ['collapse', 'minimize'],
];

describe.each(renames)('%s -> %s', (old, next) => {
  it('exists under the new name only', () => {
    expect(has(next, 'svg')).toBe(true);
    expect(has(next, 'json')).toBe(true);
    expect(has(old, 'svg')).toBe(false);
    expect(has(old, 'json')).toBe(false);
  });

  it('keeps the old name as an alias so search still finds it', () => {
    const meta = JSON.parse(readFileSync(`${icons}/${next}.json`, 'utf8')) as { aliases: string[] };
    expect(meta.aliases).toContain(old);
  });

  it('is listed in the set under the new name only', () => {
    const set = Object.values(JSON.parse(readFileSync(`${icons}/_set.json`, 'utf8')) as Record<string, string[]>).flat();
    expect(set).toContain(next);
    expect(set).not.toContain(old);
  });
});
