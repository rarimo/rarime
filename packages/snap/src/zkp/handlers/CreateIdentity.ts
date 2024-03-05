import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { utils } from 'ethers';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import { genPkHexFromEntropy, isDidSupported } from '@/zkp/helpers';
import { Identity } from '@/zkp/identity';

export const createIdentity = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.CreateIdentity]> => {
  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  const params = request.params as SnapRequestParams[RPCMethods.CreateIdentity];

  if (
    params?.privateKeyHex &&
    !utils.isHexString(`0x${params?.privateKeyHex}`)
  ) {
    throw new Error('Invalid private key');
  }

  if (
    identityStorage?.did &&
    identityStorage?.didBigInt &&
    isDidSupported(identityStorage.did)
  ) {
    return {
      identityIdString: identityStorage.did,
      identityIdBigIntString: identityStorage.didBigInt,
    };
  }

  const res =
    Boolean(identityStorage?.did && identityStorage?.didBigInt) ||
    (await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading('Identity creation'),
          divider(),
          text(`You don't have an identity yet`),
          text('Would you like to create one?'),
        ]),
      },
    }));

  if (!res) {
    throw new Error('User rejected request');
  }

  const identity = await Identity.create(
    params?.privateKeyHex || (await genPkHexFromEntropy()),
  );

  await snapStorage.setItem(StorageKeys.identity, {
    privateKeyHex: identity.privateKeyHex,
    did: identity.didString,
    didBigInt: identity.identityIdBigIntString,
  });

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Your RariMe is ready for use!'),
        divider(),
        text('Your unique identifier(DID):'),
        copyable(identity.didString),
      ]),
    },
  });

  return {
    identityIdString: identity.didString,
    identityIdBigIntString: identity.identityIdBigIntString,
  };
};
