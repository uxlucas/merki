import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { 'merki-icons': fileURLToPath(new URL('./packages/merki/src/index.ts', import.meta.url)) },
  },
  test: {
    include: [
      'scripts/**/*.test.ts',
      'packages/**/test/**/*.test.{ts,tsx}',
      'site/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    setupFiles: ['site/src/test-setup.ts'],
  },
});
