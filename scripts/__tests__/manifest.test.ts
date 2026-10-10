import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { manifestViolations, missingIcons, readManifest, type Manifest } from '../lib/manifest.js';

const small = { navigation: ['home', 'search'], objects: ['calendar'] } as unknown as Manifest;

describe('manifest', () => {
  it('the real manifest lists 145 unique names across the ten categories', async () => {
    const manifest = await readManifest(fileURLToPath(new URL('../../icons', import.meta.url)));
    const names = Object.values(manifest).flat();
    expect(names).toHaveLength(145);
    expect(new Set(names).size).toBe(145);
    expect(Object.keys(manifest).sort()).toEqual(
      ['actions', 'billing', 'communication', 'data', 'navigation', 'objects', 'people', 'status', 'system', 'text'],
    );
  });

  it('coverage lists missing icons per category', () => {
    expect(missingIcons(small, ['home'])).toEqual(['calendar', 'search']);
    expect(missingIcons(small, ['home'], 'navigation' as never)).toEqual(['search']);
    expect(missingIcons(small, ['home', 'search', 'calendar'])).toEqual([]);
  });

  it('flags icons that are not in the manifest or sit in the wrong category', () => {
    const violations = manifestViolations(small, [
      { name: 'home', category: 'navigation' as never },
      { name: 'calendar', category: 'navigation' as never },
      { name: 'rocket', category: 'objects' as never },
    ]);
    expect(violations.map((v) => `${v.icon}:${v.rule}`)).toEqual(['calendar:manifest', 'rocket:manifest']);
  });
});
