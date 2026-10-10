import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { merkiLab } from './lab-plugin';

export default defineConfig({
  plugins: [react(), merkiLab({ iconsDir: fileURLToPath(new URL('../icons', import.meta.url)) })],
});
