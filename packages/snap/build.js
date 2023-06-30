const esbuild = require('esbuild');
const plugin = require('node-stdlib-browser/helpers/esbuild/plugin');
let stdLibBrowser = require('node-stdlib-browser');

stdLibBrowser = {
  ...stdLibBrowser,
};

console.log('START building ESM bundle...');
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  outfile: 'dist/bundle.js',
  sourcemap: false,
  format: 'cjs',
  legalComments: 'none',
  plugins: [
    plugin(stdLibBrowser),
  ],
  external: [
    '@syntect/wasm'
  ],
  define: {
    Buffer: 'Buffer',
    process: 'process',
    global: 'global',
  },
  inject: [require.resolve('node-stdlib-browser/helpers/esbuild/shim')],
});
console.log('FINISH building ESM bundle');
