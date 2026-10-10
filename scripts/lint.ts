import { fileURLToPath } from 'node:url';
import { formatViolation, lintAll } from './lib/lint-all.js';

const iconsDir = fileURLToPath(new URL('../icons', import.meta.url));
const { icons, violations } = await lintAll(iconsDir);

if (violations.length > 0) {
  for (const violation of violations) console.error(formatViolation(violation));
  console.error(`\n${violations.length} problem(s). Fix them before building.`);
  process.exit(1);
}
console.log(`${icons.length} icons pass.`);
