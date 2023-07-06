import { StorageKeys } from '../enums';
import { getItemFromStore, setItemInStore } from '../rpc';
import { ProofQuery, W3CCredential } from '../types';
import { StandardJSONCredentialsQueryFilter } from './json-query-helpers';

export const saveCredential = async (
  key: string,
  value: W3CCredential,
  keyName = 'id' as keyof W3CCredential,
): Promise<void> => {
  const data = (await getItemFromStore(
    StorageKeys.credentials,
  )) as W3CCredential[];
  const items = data || [];

  const itemIndex = items.findIndex((i) => i[keyName] === key);
  if (itemIndex === -1) {
    items.push(value);
  } else {
    items[itemIndex] = value;
  }
  await setItemInStore(StorageKeys.credentials, items);
};

export const saveCredentials = async (
  value: W3CCredential[],
  keyName = 'id' as keyof W3CCredential,
): Promise<void> => {
  for (const credential of value) {
    await saveCredential(credential.id, credential, keyName);
  }
};

export const findCredentialsByQuery = async (
  query: ProofQuery,
): Promise<W3CCredential[]> => {
  const filters = StandardJSONCredentialsQueryFilter(query);
  const credentials = await getItemFromStore(StorageKeys.credentials);
  return credentials.filter((credential: W3CCredential) =>
    filters.every((filter) => filter.execute(credential)),
  );
};
