/* eslint-disable no-restricted-syntax */
import { Constants, ElemBytes } from '@iden3/js-iden3-core';

export const unmarshalBinary = (data: Uint8Array): string[] => {
  const wantLen = 2 * Constants.ELEM_BYTES_LENGTH * Constants.BYTES_LENGTH;
  if (data.length !== wantLen) {
    throw new Error();
  }
  const index = [];
  const value = [];
  for (
    let i = 0, j = Constants.ELEM_BYTES_LENGTH;
    i < Constants.ELEM_BYTES_LENGTH;
    i++, j++
  ) {
    index[i] = new ElemBytes(
      data.slice(i * Constants.BYTES_LENGTH, (i + 1) * Constants.BYTES_LENGTH),
    );

    value[i] = new ElemBytes(
      data.slice(j * Constants.BYTES_LENGTH, (j + 1) * Constants.BYTES_LENGTH),
    );
  }
  return [
    ...index.map((el) => el.toBigInt().toString()),
    ...value.map((el) => el.toBigInt().toString()),
  ];
};
