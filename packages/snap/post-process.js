const fs = require('fs');
const pathUtils = require('path');
const { postProcessBundle } = require('@metamask/snaps-utils');

const bundlePath = pathUtils.join('dist', 'bundle.js');
console.log('Bundle replace code to SES', bundlePath);

// eslint-disable-next-line node/no-sync
let bundleString = fs.readFileSync(bundlePath, 'utf8');

console.log('[Start]: MetaMask Snaps transform');

bundleString = postProcessBundle(bundleString, {
  stripComments: true,
}).code;

// Alias `window` as `self`
bundleString = 'var self = window;\n'.concat(bundleString);

console.log('[End]: MetaMask Snaps transform');

console.log('[Start]: Custom transform');

bundleString = bundleString.replace(
  "/** @type {import('cborg').TagDecoder[]} */",
  '',
);

// [Polygon ID] Fix Worker
bundleString = 'var Worker = {};\n'.concat(bundleString);

// [Polygon ID] Fix promise
bundleString = bundleString.replaceAll(
  `new Function("return this;")().Promise`,
  'Promise',
);

// [Polygon ID] fix single thread
bundleString = bundleString.replaceAll(`if (singleThread)`, `if (true)`);

// [Polygon ID] fix single thread
bundleString = bundleString.replaceAll(
  `singleThread: singleThread ? true : false`,
  `singleThread: true`,
);

// [Polygon ID] Remove fs
bundleString = bundleString.replaceAll('fs2.readFileSync;', 'null;');
bundleString = bundleString.replaceAll('fs3.readFileSync;', 'null;');

console.log('[End]: Custom transform');

fs.writeFileSync(bundlePath, bundleString);

console.log('Finished post-processing bundle');
