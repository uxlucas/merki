import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildZip, collectFiles } from '../zip.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const text = (s: string) => new TextEncoder().encode(s);

describe('buildZip', () => {
  it('round-trips names and bytes', () => {
    const files = { 'svg/a.svg': text('<svg>a</svg>'), 'svg/b.svg': text('<svg>b</svg>'), LICENSE: text('MIT') };
    const out = unzipSync(buildZip(files));
    expect(Object.keys(out).sort()).toEqual(['LICENSE', 'svg/a.svg', 'svg/b.svg']);
    for (const [name, bytes] of Object.entries(files)) expect(Array.from(out[name])).toEqual(Array.from(bytes));
  });
});

describe('collectFiles', () => {
  it('has one svg entry per icon plus LICENSE at the root', () => {
    const svgDir = at('../../packages/merki/svg');
    const names = readdirSync(svgDir).filter((f) => f.endsWith('.svg'));
    const files = collectFiles(svgDir, at('../../LICENSE'));
    expect(names.length).toBeGreaterThan(0);
    expect(Object.keys(files).sort()).toEqual(['LICENSE', ...names.map((n) => `svg/${n}`)].sort());
    expect(Array.from(files.LICENSE)).toEqual(Array.from(readFileSync(at('../../LICENSE'))));
  });
});
