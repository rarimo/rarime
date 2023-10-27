import { DID as CeramicDID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';
import { Hex } from '@iden3/js-crypto';
import { CERAMIC_ALIASES, CERAMIC_URL } from '../config';
import { getItemFromStore } from '../rpc';
import { StorageKeys } from '../enums';
import { W3CCredential } from '../types';

export const getCeramic = async () => {
  const identityStorage = await getItemFromStore(StorageKeys.identity);
  if (!identityStorage) {
    throw new Error('Identity not created');
  }
  const did = new CeramicDID({
    provider: new Ed25519Provider(
      Hex.decodeString(identityStorage.privateKeyHex),
    ),
    resolver: getResolver(),
  });
  await did.authenticate();
  const ceramic = new CeramicClient(CERAMIC_URL);
  ceramic.setDID(did);
  return ceramic;
};

export const getCeramicAndStore = async () => {
  const ceramic = await getCeramic();
  if (!ceramic.did) {
    throw new Error('DID not setted');
  }
  const datastore = new DIDDataStore({ ceramic, model: CERAMIC_ALIASES });
  return { ceramic, datastore };
};

export const saveEncryptedCredentials = async (data: W3CCredential[]) => {
  const { ceramic, datastore } = await getCeramicAndStore();

  const jwe = await ceramic.did?.createJWE(
    new TextEncoder().encode(JSON.stringify(data)),
    [ceramic.did.id],
  );
  await datastore.merge('encryptedCredentials', {
    data: btoa(JSON.stringify(jwe)),
  });
};

export const getDecryptedCredentials = async (): Promise<W3CCredential[]> => {
  const { ceramic, datastore } = await getCeramicAndStore();

  const encryptedData = await datastore.get('encryptedCredentials');
  if (!encryptedData) {
    return [];
  }
  const data = await ceramic.did?.decryptJWE(
    JSON.parse(atob(encryptedData.data)),
  );

  return JSON.parse(new TextDecoder().decode(data));
};
