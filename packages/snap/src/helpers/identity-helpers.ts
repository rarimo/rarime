import { Hex, PrivateKey } from '@iden3/js-crypto';

export const initPrivateKey = (hexString?: string): string => {
  let arr;
  if (hexString) {
    arr = Hex.decodeString(hexString);
  } else {
    arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);

    return initPrivateKey(new PrivateKey(arr).hex());
  }
  return new PrivateKey(arr).hex();
};
