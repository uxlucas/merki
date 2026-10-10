import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Category } from './categories.js';
import type { Violation } from './rules.js';

export type Manifest = Record<Category, string[]>;

export async function readManifest(dir: string): Promise<Manifest> {
  return JSON.parse(await readFile(join(dir, '_set.json'), 'utf8')) as Manifest;
}

export async function readManifestIfPresent(dir: string): Promise<Manifest | null> {
  return existsSync(join(dir, '_set.json')) ? readManifest(dir) : null;
}

export function missingIcons(manifest: Manifest, present: string[], category?: Category): string[] {
  const have = new Set(present);
  const wanted = category ? (manifest[category] ?? []) : Object.values(manifest).flat();
  return wanted.filter((name) => !have.has(name)).sort();
}

export function manifestViolations(manifest: Manifest, icons: { name: string; category: Category }[]): Violation[] {
  const home = new Map<string, string>();
  for (const [category, names] of Object.entries(manifest)) for (const name of names) home.set(name, category);
  return icons
    .filter((icon) => home.get(icon.name) !== icon.category)
    .map((icon) => ({
      icon: icon.name,
      rule: 'manifest' as const,
      detail: home.has(icon.name)
        ? `category is "${icon.category}" but icons/_set.json lists it under "${home.get(icon.name)}"`
        : 'not in icons/_set.json; add it there first (the set is curated)',
    }))
    .sort((a, b) => a.icon.localeCompare(b.icon));
}
