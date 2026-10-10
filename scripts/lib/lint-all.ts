import type { IconMeta } from './categories.js';
import { loadIcons } from './load.js';
import { parseSvg, type SvgElement } from './parse.js';
import { lintMeta, lintName, lintSvg, type Violation } from './rules.js';

export interface LintedIcon {
  name: string;
  svg: string;
  root: SvgElement;
  meta: IconMeta;
}

export async function lintAll(dir: string): Promise<{ icons: LintedIcon[]; violations: Violation[] }> {
  const { icons, orphans } = await loadIcons(dir);
  const violations: Violation[] = orphans.map((name) => ({
    icon: name,
    rule: 'orphan',
    detail: `${name}.json has no matching ${name}.svg`,
  }));
  const clean: LintedIcon[] = [];

  for (const source of icons) {
    const found: Violation[] = [...lintName(source.name)];
    const { violations: metaViolations, meta } = lintMeta(source.name, source.metaJson);
    found.push(...metaViolations);

    let root: SvgElement | null = null;
    try {
      root = await parseSvg(source.svg);
      found.push(...lintSvg(source.name, root));
    } catch (error) {
      found.push({ icon: source.name, rule: 'parse', detail: (error as Error).message });
    }

    violations.push(...found);
    if (found.length === 0 && root && meta) clean.push({ name: source.name, svg: source.svg, root, meta });
  }

  return { icons: clean, violations };
}

export const formatViolation = (v: Violation): string => `${v.icon}: ${v.rule}: ${v.detail}`;
