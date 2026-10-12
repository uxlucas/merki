import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { merkiLab } from './lab-plugin';

export default defineConfig({
  plugins: [react(), merkiLab({ iconsDir: fileURLToPath(new URL('../icons', import.meta.url)) })],
  resolve: {
    // The site uses the real components, built from the same source the package ships.
    alias: { 'merki-icons': fileURLToPath(new URL('../packages/merki/src/index.ts', import.meta.url)) },
  },
});
