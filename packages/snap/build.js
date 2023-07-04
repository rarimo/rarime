const esbuild = require('esbuild');
const plugin = require('node-stdlib-browser/helpers/esbuild/plugin');
let stdLibBrowser = require('node-stdlib-browser');
const path = require('path');

stdLibBrowser = {
  ...stdLibBrowser,
  "@iden3/js-iden3-core": path.join(__dirname, '../../node_modules/@iden3/js-iden3-core/dist/esm_esbuild/index.js'),
  "@iden3/js-jwz": path.join(__dirname, '../../node_modules/@iden3/js-jwz/dist/esm_esbuild/index.js'),
  "@iden3/js-crypto": path.join(__dirname, '../../node_modules/@iden3/js-crypto/dist/esm_esbuild/index.js'),
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
  define: {
    Buffer: 'Buffer',
    process: 'process',
    global: 'global',
  },
  inject: [require.resolve('node-stdlib-browser/helpers/esbuild/shim')],
});
console.log('FINISH building ESM bundle');
