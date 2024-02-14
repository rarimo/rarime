const esbuild = require('esbuild');
const plugin = require('node-stdlib-browser/helpers/esbuild/plugin');
let stdLibBrowser = require('node-stdlib-browser');
const path = require('path');

stdLibBrowser = {
  ...stdLibBrowser,
  '@iden3/js-iden3-core': path.join(
    __dirname,
    '../../node_modules/@iden3/js-iden3-core/dist/browser/esm/index.js',
  ),
  '@iden3/js-jwz': path.join(
    __dirname,
    '../../node_modules/@iden3/js-jwz/dist/browser/esm/index.js',
  ),
  '@iden3/js-crypto': path.join(
    __dirname,
    '../../node_modules/@iden3/js-crypto/dist/browser/esm/index.js',
  ),
  '@iden3/js-jsonld-merklization': path.join(
    __dirname,
    '../../node_modules/@iden3/js-jsonld-merklization/dist/node/esm/index.js',
  ),

  // '@cosmjs/amino': path.join(
  //   __dirname,
  //   '../../node_modules/@cosmjs/amino/build/index.js',
  // ),
  // '@leapwallet/buffer-boba': path.join(
  //   __dirname,
  //   '../../node_modules/@leapwallet/buffer-boba/dist/index.es.js',
  // ),
  // '@leapwallet/parser-parfait': path.join(
  //   __dirname,
  //   '../../node_modules/@leapwallet/parser-parfait/dist/index.es.js',
  // ),
  // '@noble/secp256k1': path.join(
  //   __dirname,
  //   '../../node_modules/@noble/secp256k1/lib/esm/index.js',
  // ),
  // '@metamask/key-tree': path.join(
  //   __dirname,
  //   '../../node_modules/@metamask/key-tree/dist/esm/index.js',
  // ),
  // '@noble/hashes': path.join(
  //   __dirname,
  //   '../../node_modules/@noble/hashes/esm/index.js',
  // ),
  // 'base64-js': path.join(__dirname, '../../node_modules/base64-js/index.js'),
  // bech32: path.join(__dirname, '../../node_modules/bech32/dist/index.js'),
  // 'cosmjs-types': path.join(
  //   __dirname,
  //   '../../node_modules/cosmjs-types/index.js',
  // ),
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
  plugins: [plugin(stdLibBrowser)],
  define: {
    Buffer: 'Buffer',
    process: 'process',
    global: 'global',
  },
  inject: [require.resolve('node-stdlib-browser/helpers/esbuild/shim')],
});
console.log('FINISH building ESM bundle');
