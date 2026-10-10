import { defineConfig } from 'tsup';

// bundle: false keeps one output file per icon. Bundlers drop whole unused modules,
// and the /* @__PURE__ */ annotations cover anyone who bundles the package themselves.
export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  bundle: false,
  dts: { entry: 'src/index.ts' },
  clean: true,
  outDir: 'dist',
  external: ['react'],
});
