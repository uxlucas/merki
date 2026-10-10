import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from './lib/categories.js';
import { loadIcons } from './lib/load.js';
import { renderSheet } from './lib/sheet.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const arg = process.argv[2];
if (!arg) {
  console.error('usage: npm run sheet -- <category | name,name,...>');
  process.exit(1);
}

const { icons } = await loadIcons(at('../icons'));
const wanted = (CATEGORIES as readonly string[]).includes(arg)
  ? icons.filter((i) => i.metaJson !== null && JSON.parse(i.metaJson).category === arg)
  : icons.filter((i) => arg.split(',').includes(i.name));
if (wanted.length === 0) {
  console.error(`no icons match "${arg}"`);
  process.exit(1);
}

await mkdir(at('../sheets'), { recursive: true });
const out = at(`../sheets/${arg.replace(/[^a-z0-9-]+/g, '_')}.png`);
await writeFile(out, renderSheet(wanted.map((i) => ({ name: i.name, svg: i.svg }))));
console.log(`${wanted.length} icons → ${out}`);
