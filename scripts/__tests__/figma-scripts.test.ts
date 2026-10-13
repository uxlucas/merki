import { describe, expect, it } from 'vitest';
import { fingerprint } from '../figma/core.js';
import { buildScripts } from '../figma-scripts.js';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const scripts = buildScripts();

describe('generated Figma scripts', () => {
  it('runs setup first, then one script per category, then deprecations', () => {
    const names = scripts.map((s) => s.name);
    expect(names[0]).toBe('00-setup');
    expect(names.filter((n) => n.startsWith('10-components-'))).toHaveLength(10);
    expect(names).toContain('20-deprecated');
    expect(names.indexOf('20-deprecated')).toBeGreaterThan(names.lastIndexOf('10-components-billing'));
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
});
