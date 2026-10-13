import { describe, expect, it } from 'vitest';
import { fingerprint } from '../figma/core.js';
import { buildScripts } from '../figma-scripts.js';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const scripts = buildScripts();

describe('generated Figma scripts', () => {
  it('runs setup first, then one script per category, then deprecations, then the presentation pages', () => {
    const names = scripts.map((s) => s.name);
    expect(names[0]).toBe('00-setup');
    expect(names.filter((n) => n.startsWith('10-components-'))).toHaveLength(10);
    expect(names).toContain('20-deprecated');
    expect(names.indexOf('20-deprecated')).toBeGreaterThan(names.lastIndexOf('10-components-billing'));
    const pages = ['30-icons', '40-cover', '50-construction', '60-changelog', '90-check'];
    expect(names.slice(names.indexOf('20-deprecated') + 1)).toEqual(pages);
  });

  it('ends with a read-only check that embeds no data', () => {
    const check = scripts.find((s) => s.name === '90-check')!;
    expect(check.fingerprint).toBeNull();
    expect(check.code).not.toMatch(/^const DATA = /m);
    expect(check.code).toMatch(/return await checkComponents\(\);\s*$/);
  });

  it('keeps every script under the 50,000-character use_figma limit and compiling', () => {
    for (const s of scripts) {
      expect(s.code.length, s.name).toBeLessThan(50_000);
      expect(() => new AsyncFunction(s.code), s.name).not.toThrow();
      expect(s.code, s.name).not.toMatch(/^export /m);
      expect(s.code, s.name).not.toMatch(/^\{\s*$/m);
      expect(s.code, s.name).not.toMatch(/setPluginData|loadAllPagesAsync|figma\.notify|closePlugin/);
    }
  });

  it('puts every icon in exactly one components script', () => {
    const all = scripts.filter((s) => s.name.startsWith('10-')).flatMap((s) => [...s.code.matchAll(/"setName":"([a-z0-9/-]+)"/g)].map((m) => m[1]));
    expect(all).toHaveLength(157);
    expect(new Set(all).size).toBe(157);
  });

  it('passes the full set list to the deprecation script', () => {
    const dep = scripts.find((s) => s.name === '20-deprecated')!;
    const names = JSON.parse(dep.code.match(/^const DATA = (\[.*\]);$/m)![1]) as string[];
    expect(names).toHaveLength(157);
    expect(names).toContain('objects/calendar');
  });

  it('returns a fingerprint of the exact data embedded in each script', () => {
    const withData = scripts.filter((s) => s.fingerprint !== null);
    expect(withData.map((s) => s.name)).toContain('20-deprecated');
    expect(scripts.find((s) => s.name === '00-setup')!.fingerprint).toBeNull();
    for (const s of withData) {
      const json = s.code.match(/^const DATA = (.*);$/m)![1];
      expect(fingerprint(JSON.parse(json)), s.name).toBe(s.fingerprint);
      expect(s.code, s.name).toContain('fingerprint: fingerprint(DATA)');
    }
  });

  it('checks the data fingerprint before the call, against the manifest value', () => {
    for (const s of scripts.filter((x) => x.fingerprint !== null)) {
      const guard = `const EXPECTED = '${s.fingerprint}';\nif (fingerprint(DATA) !== EXPECTED) throw new Error(`;
      expect(s.code, s.name).toContain(guard);
      expect(s.code.indexOf(guard), s.name).toBeLessThan(s.code.lastIndexOf('return { ...(await '));
    }
  });

  /** A `figma` stand-in that records every property read and returns nothing usable. */
  const recordingFigma = () => {
    const reads: PropertyKey[] = [];
    const stub = new Proxy({}, { get: (_target, prop) => (reads.push(prop), undefined) });
    return { stub, reads };
  };

  it('throws on mis-copied data before touching the file', async () => {
    for (const s of scripts.filter((x) => x.fingerprint !== null)) {
      const start = s.code.indexOf('const DATA = ');
      const at = s.code.indexOf('"', start) + 1;
      const swapped = s.code[at] === 'a' ? 'b' : 'a';
      const mutated = `${s.code.slice(0, at)}${swapped}${s.code.slice(at + 1)}`;
      expect(mutated, s.name).not.toBe(s.code);
      const { stub, reads } = recordingFigma();
      await expect(new AsyncFunction('figma', mutated)(stub), s.name).rejects.toThrow(/Merki: data fingerprint mismatch/);
      expect(reads, s.name).toEqual([]);
    }
  });

  it('gets past the guard when the data is intact', async () => {
    const s = scripts.find((x) => x.name === '20-deprecated')!;
    const { stub, reads } = recordingFigma();
    await expect(new AsyncFunction('figma', s.code)(stub)).rejects.not.toThrow(/fingerprint mismatch/);
    expect(reads.length).toBeGreaterThan(0);
  });
});
