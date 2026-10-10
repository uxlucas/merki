import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { formatViolation, lintAll } from './lint-all.js';
import { optimizeSvg, withSize } from './optimize.js';
import { parseSvg } from './parse.js';
import { renderIconModule, renderIndex, toIconNode } from './react.js';
import { lintSvg, type Violation } from './rules.js';
import { toSiteIcon, type SiteIcon } from './site-data.js';

export interface BuildPaths {
  iconsDir: string;
  packageDir: string;
  siteDataFile: string;
}

export async function buildAll(paths: BuildPaths): Promise<{ count: number; violations: Violation[] }> {
  const { icons, violations } = await lintAll(paths.iconsDir);
  if (violations.length > 0) return { count: 0, violations };

  const svgDir = join(paths.packageDir, 'svg');
  const modulesDir = join(paths.packageDir, 'src', 'icons');
  await rm(svgDir, { recursive: true, force: true });
  await rm(modulesDir, { recursive: true, force: true });
  await mkdir(svgDir, { recursive: true });
  await mkdir(modulesDir, { recursive: true });
  await mkdir(dirname(paths.siteDataFile), { recursive: true });

  const site: SiteIcon[] = [];
  for (const icon of icons) {
    const optimized = optimizeSvg(icon.svg);
    const root = await parseSvg(optimized);
    const broken = lintSvg(icon.name, root);
    if (broken.length > 0) {
      throw new Error(`the optimizer broke ${icon.name}: ${broken.map(formatViolation).join('; ')}`);
    }
    await writeFile(join(svgDir, `${icon.name}.svg`), `${withSize(optimized)}\n`);
    await writeFile(join(modulesDir, `${icon.name}.ts`), renderIconModule(icon.name, toIconNode(root)));
    site.push(toSiteIcon(icon.name, icon.meta, optimized));
  }

  await writeFile(join(paths.packageDir, 'src', 'index.ts'), renderIndex(icons.map((icon) => icon.name)));
  await writeFile(paths.siteDataFile, `${JSON.stringify(site, null, 2)}\n`);
  return { count: icons.length, violations: [] };
}
