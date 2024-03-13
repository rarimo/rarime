import type { Claim } from '@iden3/js-iden3-core';

import { ProofType } from '@/enums';
import { getCoreClaimFromProof, proofFromJson } from '@/helpers/proof-helpers';
import type {
  CredentialStatus,
  RevocationStatus,
  W3CCredential,
} from '@/types';

export const getRevocationStatus = async (
  credStatus: CredentialStatus,
): Promise<RevocationStatus> => {
  const response = await fetch(credStatus.id);

  const data = await response.json();

  const { issuer } = data;

  const mtp = proofFromJson(data.mtp);

  return {
    mtp,
    issuer,
  };
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
