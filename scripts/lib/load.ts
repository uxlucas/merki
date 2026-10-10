import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface IconSource {
  name: string;
  svg: string;
  metaJson: string | null;
}

export interface LoadResult {
  icons: IconSource[];
  orphans: string[];
}

export async function loadIcons(dir: string): Promise<LoadResult> {
  const files = (await readdir(dir)).filter((f) => !f.startsWith('_') && !f.startsWith('.'));
  const svgNames = files
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -'.svg'.length))
    .sort();
  const jsonNames = new Set(files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length)));

  const icons = await Promise.all(
    svgNames.map(async (name) => ({
      name,
      svg: await readFile(join(dir, `${name}.svg`), 'utf8'),
      metaJson: jsonNames.has(name) ? await readFile(join(dir, `${name}.json`), 'utf8') : null,
    })),
  );

  const svgSet = new Set(svgNames);
  const orphans = [...jsonNames].filter((name) => !svgSet.has(name)).sort();
  return { icons, orphans };
}
