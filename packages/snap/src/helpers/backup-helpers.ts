import { StorageKeys } from '../enums';
import { Identity } from '../identity';
import { getItemFromStore, setItemInStore } from '../rpc';
import { BackupData } from '../types';

export const exportKeysAndCredentials = async () => {
  const credentials = (await getItemFromStore(StorageKeys.credentials)) || [];
  const identity = await getItemFromStore(StorageKeys.identity);

  return JSON.stringify({
    privateKey: identity?.privateKeyHex,
    credentials,
  });
};

export const importKeysAndCredentials = async (backupData: BackupData) => {
  if (!backupData.credentials?.length && !backupData.privateKey) {
    throw new Error('You provided an empty backup');
  }

  if (backupData.privateKey) {
    const identity = await Identity.create(backupData.privateKey);
    await setItemInStore(StorageKeys.identity, {
      privateKeyHex: identity.privateKeyHex,
      did: identity.didString,
    });
  }

  if (backupData.credentials?.length) {
    await setItemInStore(StorageKeys.credentials, backupData.credentials);
  }
};
