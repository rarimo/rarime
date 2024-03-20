import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import { isOriginInWhitelist } from '@/zkp/helpers';

export const exportIdentity = async ({
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}) => {
  if (!isOriginInWhitelist(origin)) {
    throw new Error('This origin does not have access to export identity');
  }

  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  if (!identityStorage.privateKeyHex) {
    throw new Error('Identity not created');
  }

  return snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Your RariMe private key'),
        divider(),
        text('Сopy:'),
        copyable(identityStorage.privateKeyHex),
      ]),
    },
  });
};
