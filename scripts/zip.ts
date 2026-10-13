import { mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** The archive's entries: `svg/<name>.svg` for every icon, and the license at the root. */
export function collectFiles(svgDir: string, licenseFile: string): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const name of readdirSync(svgDir).filter((f) => f.endsWith('.svg')).sort()) {
    files[`svg/${name}`] = readFileSync(`${svgDir}/${name}`);
  }
  files.LICENSE = readFileSync(licenseFile);
  return files;
}

export function buildZip(files: Record<string, Uint8Array>): Uint8Array {
  return zipSync(files, { level: 9 });
}

const isMain = Boolean(process.argv[1]) && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
if (isMain) {
  const { version } = JSON.parse(readFileSync(at('../packages/merki/package.json'), 'utf8')) as { version: string };
  const files = collectFiles(at('../packages/merki/svg'), at('../LICENSE'));
  const outDir = at('../release');
  mkdirSync(outDir, { recursive: true });
  const outFile = at(`../release/merki-icons-svg-${version}.zip`);
  writeFileSync(outFile, buildZip(files));
  console.log(`Wrote ${outFile} (${Object.keys(files).length} files).`);
}
