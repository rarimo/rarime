import { JSONLDSchemas, StorageKeys } from '../enums';
import { Identity } from '../identity';
import { getItemFromStore, setItemInStore } from '../rpc';
import { BackupData, W3CCredential } from '../types';

export const exportKeysAndCredentials = async () => {
  const credentials = (await getItemFromStore(StorageKeys.credentials)) || [];
  const identity = await getItemFromStore(StorageKeys.identity);

  return JSON.stringify({
    privateKey: identity?.privateKeyHex,
    credentials,
  });
};

export const validateCredentials = (
  credentials: W3CCredential[],
  did: string,
) => {
  if (!Array.isArray(credentials)) {
    return false;
  } else if (!credentials.length) {
    return true;
  }
  return credentials.every(
    (cred) =>
      cred?.credentialSubject?.id === did &&
      cred?.['@context']?.[1] === JSONLDSchemas.Iden3Credential,
  );
};

export const importKeysAndCredentials = async (backupData: BackupData) => {
  if (!backupData.credentials?.length && !backupData.privateKey) {
    throw new Error('You provided an empty backup');
  } else if (!backupData.privateKey) {
    throw new Error('You provided a backup with an empty private key');
  }
  // this method throw an error if private key is not valid
  const identity = await Identity.create(backupData.privateKey);

  if (
    backupData.credentials &&
    !validateCredentials(backupData.credentials, identity.didString)
  ) {
    throw new Error('Credentials is not valid');
  }

  await setItemInStore(StorageKeys.identity, {
    privateKeyHex: identity.privateKeyHex,
    did: identity.didString,
  });

  await setItemInStore(StorageKeys.credentials, backupData?.credentials || []);
};
