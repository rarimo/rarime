import intl from 'intl/lib/core';

global.Intl = intl;

// eslint-disable-next-line import/unambiguous
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = (array: any) => {
    for (let i = 0, { length } = array; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}
