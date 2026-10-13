import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const at = (path) => fileURLToPath(new URL(path, import.meta.url));

// The README and LICENSE live at the repo root; npm only packs files inside the package.
for (const file of ['README.md', 'LICENSE']) copyFileSync(at(`../../${file}`), at(`./${file}`));
