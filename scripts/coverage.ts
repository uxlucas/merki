import { fileURLToPath } from 'node:url';
import { CATEGORIES, type Category } from './lib/categories.js';
import { loadIcons } from './lib/load.js';
import { missingIcons, readManifest } from './lib/manifest.js';

const dir = fileURLToPath(new URL('../icons', import.meta.url));
const arg = process.argv[2] as Category | undefined;
if (arg && !(CATEGORIES as readonly string[]).includes(arg)) {
  console.error(`unknown category "${arg}"; one of: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}
const manifest = await readManifest(dir);
const { icons } = await loadIcons(dir);
const missing = missingIcons(manifest, icons.map((i) => i.name), arg);
const total = arg ? manifest[arg].length : Object.values(manifest).flat().length;
console.log(`${total - missing.length}/${total} drawn${arg ? ` in ${arg}` : ''}, ${missing.length} missing`);
if (missing.length) console.log(missing.join('\n'));
