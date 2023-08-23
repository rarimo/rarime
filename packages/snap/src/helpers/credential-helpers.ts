import { Claim } from '@iden3/js-iden3-core';
import { ProofType, StorageKeys } from '../enums';
import { getItemFromStore, setItemInStore } from '../rpc';
import {
  CredentialStatus,
  ProofQuery,
  RevocationStatus,
  W3CCredential,
} from '../types';
import { StandardJSONCredentialsQueryFilter } from './json-query-helpers';
import { getCoreClaimFromProof } from './proof-helpers';

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
  const credentials = (await getItemFromStore(StorageKeys.credentials)) || [];
  return credentials.filter((credential: W3CCredential) =>
    filters.every((filter) => filter.execute(credential)),
  );
};

export const getRevocationStatus = async (
  credStatus: CredentialStatus,
): Promise<RevocationStatus> => {
  const data = await fetch(credStatus.id);

  return await data.json();
};

export const findNonRevokedCredential = async (
  creds: W3CCredential[],
): Promise<{
  cred: W3CCredential;
  revStatus: RevocationStatus;
}> => {
  for (const cred of creds) {
    const revStatus = await getRevocationStatus(cred.credentialStatus);
    if (revStatus.mtp.existence) {
      continue;
    }
    return { cred, revStatus };
  }
  throw new Error('all claims are revoked');
};

const getCoreClaimFromCredential = async (
  credential: W3CCredential,
): Promise<Claim> => {
  const coreClaimFromSigProof = getCoreClaimFromProof(
    credential.proof!,
    ProofType.BJJSignature,
  );

  const coreClaimFromMtpProof = getCoreClaimFromProof(
    credential.proof!,
    ProofType.Iden3SparseMerkleTreeProof,
  );

  if (
    coreClaimFromMtpProof &&
    coreClaimFromSigProof &&
    coreClaimFromMtpProof.hex() !== coreClaimFromSigProof.hex()
  ) {
    throw new Error(
      'core claim representations is set in both proofs but they are not equal',
    );
  }

  if (!coreClaimFromMtpProof && !coreClaimFromSigProof) {
    throw new Error('core claim is not set in credential proofs');
  }

  const coreClaim = coreClaimFromMtpProof ?? coreClaimFromSigProof!;

  return coreClaim;
};

export const getPreparedCredential = async (credential: W3CCredential) => {
  const { cred: nonRevokedCred, revStatus } = await findNonRevokedCredential([
    credential,
  ]);

  const credCoreClaim = await getCoreClaimFromCredential(nonRevokedCred);

  return {
    credential: nonRevokedCred,
    revStatus,
    credentialCoreClaim: credCoreClaim,
  };
};

export const loadDataByUrl = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};
