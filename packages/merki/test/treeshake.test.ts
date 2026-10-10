import { build } from 'esbuild';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { renderIconModule, renderIndex } from '../../../scripts/lib/react.js';

const createIconPath = fileURLToPath(new URL('../src/create-icon.ts', import.meta.url)).replace(/\\/g, '/');
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'merki-shake-'));
  await mkdir(join(dir, 'icons'));
  await writeFile(join(dir, 'icons', 'alpha.ts'), renderIconModule('alpha', [['path', { d: 'M2 2h11.11' }]], createIconPath));
  await writeFile(join(dir, 'icons', 'beta.ts'), renderIconModule('beta', [['path', { d: 'M4 4h22.22' }]], createIconPath));
  await writeFile(join(dir, 'index.ts'), renderIndex(['alpha', 'beta'], createIconPath));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

it('importing one icon does not ship the others', async () => {
  const result = await build({
    stdin: { contents: "import { AlphaIcon } from './index.ts'; console.log(AlphaIcon);", resolveDir: dir, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    external: ['react'],
    logLevel: 'silent',
  });
  const output = result.outputFiles[0].text;
  expect(output).toContain('M2 2h11.11');
  expect(output).not.toContain('M4 4h22.22');
});
