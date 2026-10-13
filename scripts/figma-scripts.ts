import { mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';
import { fingerprint } from './figma/core.js';
import { figmaCategories, type SourceIcon } from './lib/figma-data.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Transpile a runtime file for inlining: no exports, no types, plain JS. */
function runtime(file: string): string {
  const { code } = transformSync(readFileSync(at(file), 'utf8'), { loader: 'ts', format: 'esm', target: 'es2020' });
  return code.replace(/^export \{[^}]*\};?\s*$/m, '').replace(/^export /gm, '');
}

export interface Script {
  name: string;
  purpose: string;
  code: string;
  /** Expected fingerprint of the embedded data; null when the script embeds none. */
  fingerprint: string | null;
}

export function buildScripts(): Script[] {
  const icons = JSON.parse(readFileSync(at('../site/src/data/icons.json'), 'utf8')) as SourceIcon[];
  const order = JSON.parse(readFileSync(at('../icons/_set.json'), 'utf8')) as Record<string, string[]>;
  const categories = figmaCategories(icons, order);
  const core = runtime('./figma/core.ts');
  const script = (name: string, purpose: string, body: string, expected: string | null = null): Script => ({
    name,
    purpose,
    code: `${core}\n${body}\n`,
    fingerprint: expected,
  });
  /** A script whose payload sits on one `const DATA = ...;` line and whose result carries the payload's fingerprint. */
  const dataScript = (name: string, purpose: string, data: unknown, call: string): Script =>
    script(name, purpose, `const DATA = ${JSON.stringify(data)};\nreturn { ...(await ${call}), fingerprint: fingerprint(DATA) };`, fingerprint(data));

  return [
    script(
      '00-setup',
      'Create the five pages in order and the Merki/icon colour variable (Light, Dark).',
      'const created = await ensurePages();\nconst variable = await ensureIconVariable();\nreturn { pages: figma.root.children.map((p) => p.name), createdPageIds: created, variableId: variable.id };',
    ),
    ...categories.map((category, index) =>
      dataScript(
        `10-components-${category.id}`,
        `Update or create the ${category.label} component sets on the Components page.`,
        { id: category.id, label: category.label, previousLabel: index ? categories[index - 1].label : null, icons: category.icons },
        'syncCategory(DATA)',
      ),
    ),
    dataScript(
      '20-deprecated',
      'Move component sets the repo no longer has into the Deprecated section.',
      categories.flatMap((c) => c.icons.map((i) => i.setName)),
      'deprecateMissing(DATA)',
    ),
  ];
}

const isMain = Boolean(process.argv[1]) && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
if (isMain) {
  const out = at('../figma/out');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const scripts = buildScripts();
  for (const s of scripts) writeFileSync(`${out}/${s.name}.js`, s.code);
  writeFileSync(`${out}/manifest.json`, `${JSON.stringify(scripts.map((s) => ({ file: `${s.name}.js`, purpose: s.purpose, chars: s.code.length, fingerprint: s.fingerprint })), null, 2)}\n`);
  console.log(`Wrote ${scripts.length} scripts to figma/out (largest ${Math.max(...scripts.map((s) => s.code.length))} chars).`);
}
