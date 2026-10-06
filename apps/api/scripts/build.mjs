import { build } from 'esbuild'

await build({
  entryPoints: ['src/handler.ts', 'src/account-handler.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  conditions: ['source'],
  banner: {
    // Bundled CommonJS dependencies still require Node built-ins.
    js: "import { createRequire as createNodeRequire } from 'node:module'; const require = createNodeRequire(import.meta.url);",
  },
})
