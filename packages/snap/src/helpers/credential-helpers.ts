import { Claim } from '@iden3/js-iden3-core';
import { sha256 } from 'ethers/lib/utils';
import { ProofType, StorageKeys } from '../enums';
import {
  CreateVc,
  // CreateVcMutation,
  // CreateVcMutationVariables,
  CredentialStatus,
  GetAllVerifiableCredentials,
  GetAllVerifiableCredentialsQuery,
  GetVerifiableCredentialsByQueryHash,
  GetVerifiableCredentialsByQueryHashQuery,
  ProofQuery,
  RevocationStatus,
  W3CCredential,
} from '../types';
import { getItemFromStore, setItemInStore } from '../rpc';
import { getCoreClaimFromProof } from './proof-helpers';
import { CeramicProvider } from './ceramic-helpers';

const hashVC = (type: string, issuerDid: string) => {
  return sha256(Buffer.from(issuerDid + type));
};

export const encryptAndSaveVC = async (credential: W3CCredential) => {
  const ceramicProvider = new CeramicProvider();

  const encryptedVC = await ceramicProvider.encrypt(credential);

  const queryHash = hashVC(
    String(credential.credentialSubject.type),
    credential.issuer,
  );

  const client = await ceramicProvider.client();

  // await client.mutate<CreateVcMutation, CreateVcMutationVariables>({
  //   mutation: CreateVc,
  //   variables: {
  //     input: {
  //       content: {
  //         data: encryptedVC,
  //         queryHash,
  //       },
  //     },
  //   },
  // });

  await client.execute(CreateVc, {
    input: {
      content: {
        data: encryptedVC,
        queryHash,
      },
    },
  });
};

// TODO: add pagination
export const getAllDecryptedVCs = async (): Promise<W3CCredential[]> => {
  const ceramicProvider = new CeramicProvider();

  const client = await ceramicProvider.client();

  // const { data } = await client.query<GetAllVerifiableCredentialsQuery>({
  //   query: GetAllVerifiableCredentials,
  //   fetchPolicy: 'network-only',
  //   variables: {
  //     last: 1000,
  //   },
  // });

  const { data } = await client.execute<GetAllVerifiableCredentialsQuery>(
    GetAllVerifiableCredentials,
    {
      last: 1000,
    },
  );

  if (!data?.verifiableCredentialIndex?.edges?.length) {
    return [];
  }

  return await Promise.all(
    data.verifiableCredentialIndex.edges.map(async (el) => {
      const encryptedVC = el?.node?.data as string;

      return await ceramicProvider.decrypt<W3CCredential>(encryptedVC);
    }),
  );
};

export const getVCsByQuery = async (
  query: ProofQuery,
  issuerDiD: string,
): Promise<W3CCredential[]> => {
  const ceramicProvider = new CeramicProvider();

  const queryHash = hashVC(String(query.type), issuerDiD);

  const client = await ceramicProvider.client();

  // const { data } = await client.query<GetVerifiableCredentialsByQueryHashQuery>(
  //   {
  //     query: GetVerifiableCredentialsByQueryHash,
  //     fetchPolicy: 'network-only',
  //     variables: {
  //       queryHash,
  //     },
  //   },
  // );

  const {
    data,
  } = await client.execute<GetVerifiableCredentialsByQueryHashQuery>(
    GetVerifiableCredentialsByQueryHash,
    {
      queryHash,
    },
  );

  if (!data?.verifiableCredentialIndex?.edges?.length) {
    return [];
  }

  return await Promise.all(
    data.verifiableCredentialIndex.edges.map(async (el) => {
      const encryptedVC = el?.node?.data as string;

      return await ceramicProvider.decrypt<W3CCredential>(encryptedVC);
    }),
  );
};

export const moveStoreVCtoCeramic = async () => {
  const credentials = (await getItemFromStore(StorageKeys.credentials)) || [];
  if (credentials.length) {
    await Promise.all(
      credentials.map(async (credential: W3CCredential) => {
        await encryptAndSaveVC(credential);
      }),
    );
    await setItemInStore(StorageKeys.credentials, []);
  }
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
