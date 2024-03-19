const fs = require('fs');
const pathUtils = require('path');
const { postProcessBundle } = require('@metamask/snaps-utils/node');

const bundlePath = pathUtils.join('dist', 'bundle.js');
console.log('Bundle replace code to SES', bundlePath);

// eslint-disable-next-line node/no-sync
let bundleString = fs.readFileSync(bundlePath, 'utf8');

bundleString = postProcessBundle(bundleString, {
  stripComments: true,
}).code;

bundleString = 'var Worker = {};\n'.concat(bundleString);

bundleString = bundleString.replace(
  "/** @type {import('cborg').TagDecoder[]} */",
  '',
);

// Remove eval
bundleString = bundleString.replaceAll(`eval(`, 'evalIn(');

// Remove eval
bundleString = bundleString.replaceAll(`process.browser`, 'true'); // Remove eval

bundleString = bundleString.replaceAll(
  `Response,
      Request,`,
  'Request,',
);

// fix promise
bundleString = bundleString.replaceAll(
  `new Function("return this;")().Promise`,
  'Promise',
);

// fix single thread
bundleString = bundleString.replaceAll(`if (singleThread)`, `if (true)`);

// fix single thread
bundleString = bundleString.replaceAll(
  `singleThread: singleThread ? true : false`,
  `singleThread: true`,
);

// undefined Response
bundleString = bundleString.replaceAll(
  `class ResponseWithURL extends Response {
      constructor(url, body, options) {
        super(body, options);
        Object.defineProperty(this, 'url', {
          value: url
        });
      }
    }`,
  '',
);

// undefined Response
bundleString = bundleString.replaceAll(
  `class ResponseWithURL extends Response {
  constructor(url, body, options) {
    super(body, options);
    Object.defineProperty(this, 'url', {
      value: url
    });
  }
}`,
  '',
);

// undefined Response
bundleString = bundleString.replaceAll(
  `var ResponseWithURL = class extends Response2 {
      /**
       * @param {string} url
       * @param {BodyInit} body
       * @param {ResponseInit} options
       */
      constructor(url, body, options) {
        super(body, options);
        Object.defineProperty(this, "url", { value: url });
      }
    };`,
  '',
);

// Fix TextEncoder and TextDecoder
bundleString = bundleString.replace('var empty2 = null;', 'var empty2 = {};');

// eslint-disable-next-line node/no-sync
fs.writeFileSync(bundlePath, bundleString);
console.log('Bundle replaced code to SES', bundlePath);
