import { Claim } from '@iden3/js-iden3-core';
import { ProofType } from '../enums';
import {
  CredentialStatus,
  ProofQuery,
  RevocationStatus,
  W3CCredential,
} from '../types';
import { StandardJSONCredentialsQueryFilter } from './json-query-helpers';
import { getCoreClaimFromProof } from './proof-helpers';
import {
  getDecryptedCredentials,
  saveEncryptedCredentials,
} from './ceramic-helpers';

export const saveCredentials = async (
  credentials: W3CCredential[],
  keyName = 'id' as keyof W3CCredential,
): Promise<void> => {
  const data = await getDecryptedCredentials();
  const items = [...data];

  for (const credential of credentials) {
    const itemIndex = items.findIndex(
      (i) => i[keyName] === credential[keyName],
    );
    if (itemIndex === -1) {
      items.push(credential);
    } else {
      items[itemIndex] = credential;
    }
  }
  await saveEncryptedCredentials(items);
};

export const findCredentialsByQuery = async (
  query: ProofQuery,
): Promise<W3CCredential[]> => {
  const filters = StandardJSONCredentialsQueryFilter(query);
  const credentials = await getDecryptedCredentials();
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

export const loadDataByUrl = async (
  url: string,
  endianSwappedCoreStateHash?: string,
) => {
  const response = await fetch(
    endianSwappedCoreStateHash
      ? `${url}?state=${endianSwappedCoreStateHash}`
      : url,
  );

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};
