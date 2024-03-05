import { RPCMethods, SnapRequestsResponses } from '@rarimo/rarime-connector';
import { snapStorage } from '@/helpers';
import { StorageKeys } from '@/enums';

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
