import type {
  RPCMethods,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';

export const getIdentity = async (): Promise<
  SnapRequestsResponses[RPCMethods.GetIdentity]
> => {
  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  if (!identityStorage) {
    throw new Error('Identity not created');
  }

  return {
    identityIdString: identityStorage.did,
    identityIdBigIntString: identityStorage.didBigInt,
  };
};
