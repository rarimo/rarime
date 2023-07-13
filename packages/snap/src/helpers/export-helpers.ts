import { StorageKeys } from '../enums';
import { getItemFromStore } from '../rpc';

export const exportKeysAndCredentials = async () => {
  const credentials = (await getItemFromStore(StorageKeys.credentials)) || [];
  const identity = (await getItemFromStore(StorageKeys.identity)) || null;

  return JSON.stringify({
    identity,
    credentials,
  });
};
