import { fileURLToPath } from 'node:url';
import { buildAll } from './lib/build-all.js';
import { formatViolation } from './lib/lint-all.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const { count, violations } = await buildAll({
  iconsDir: at('../icons'),
  packageDir: at('../packages/merki'),
  siteDataFile: at('../site/src/data/icons.json'),
});

if (violations.length > 0) {
  for (const violation of violations) console.error(formatViolation(violation));
  console.error(`\n${violations.length} problem(s). Nothing was generated.`);
  process.exit(1);
}
console.log(`Generated ${count} icons.`);
