import type { IconMeta } from './categories.js';
import { loadIcons } from './load.js';
import { manifestViolations, readManifestIfPresent } from './manifest.js';
import { parseSvg, type SvgElement } from './parse.js';
import { componentName } from './react.js';
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
  let clean: LintedIcon[] = [];
  const allNames: string[] = [];

  for (const source of icons) {
    allNames.push(source.name);
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

  const byComponent = new Map<string, string[]>();
  for (const name of allNames) {
    const component = componentName(name);
    byComponent.set(component, [...(byComponent.get(component) ?? []), name]);
  }
  const collided = new Set<string>();
  for (const [component, names] of byComponent) {
    if (names.length < 2) continue;
    const list = names.map((n) => `"${n}"`);
    for (const name of names) {
      collided.add(name);
      violations.push({
        icon: name,
        rule: 'collision',
        detail: `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]} both generate ${component}`,
      });
    }
  }
  clean = clean.filter((icon) => !collided.has(icon.name));

  const manifest = await readManifestIfPresent(dir);
  if (manifest) {
    const flagged = manifestViolations(manifest, clean.map((i) => ({ name: i.name, category: i.meta.category })));
    violations.push(...flagged);
    const flaggedNames = new Set(flagged.map((v) => v.icon));
    clean = clean.filter((icon) => !flaggedNames.has(icon.name));
  }

  return { icons: clean, violations };
}

export const formatViolation = (v: Violation): string => `${v.icon}: ${v.rule}: ${v.detail}`;
