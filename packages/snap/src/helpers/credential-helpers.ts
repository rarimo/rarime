import { Claim } from '@iden3/js-iden3-core';
import { sha256 } from 'ethers/lib/utils';
import { DocumentNode } from 'graphql/language';
import { ProofType, StorageKeys } from '../enums';
import {
  SaveCredentialsRequestParams,
  ClearVc,
  ClearVcMutation,
  ClearVcMutationVariables,
  CreateVc,
  CreateVcMutationVariables,
  CredentialStatus,
  GetAllVerifiableCredentials,
  GetAllVerifiableCredentialsQuery,
  GetAllVerifiableCredentialsQueryVariables,
  GetVerifiableCredentialsByClaimId,
  GetVerifiableCredentialsByClaimIdQuery,
  GetVerifiableCredentialsByClaimIdQueryVariables,
  GetVerifiableCredentialsByQueryHash,
  GetVerifiableCredentialsByQueryHashQuery,
  GetVerifiableCredentialsByQueryHashQueryVariables,
  ProofQuery,
  RevocationStatus,
  W3CCredential,
} from '../types';
import { getItemFromStore, setItemInStore } from '../rpc';
import { getCoreClaimFromProof } from './proof-helpers';
import { CeramicProvider } from './ceramic-helpers';

const _SALT = 'pu?)Rx829U3ot.iB)D+z9Iyh';

export const hashVC = (type: string, issuerDid: string, ownerDid: string) => {
  return sha256(Buffer.from(issuerDid + type + ownerDid));
};

const getClaimIdFromVC = (credential: W3CCredential) => {
  try {
    const claimIdUrl = new URL(credential.id);

    const pathNameParts = claimIdUrl.pathname.split('/');

    return pathNameParts[pathNameParts.length - 1];
  } catch (error) {
    return credential.id;
  }
};

const getClaimIdsFromOffer = (offer: SaveCredentialsRequestParams) => {
  return offer.body.Credentials.map((cred) => cred.id);
};

const loadAllCredentialsListPages = async <
  V extends Record<string, unknown>,
  Res extends
    | GetAllVerifiableCredentialsQuery
    | GetVerifiableCredentialsByClaimIdQuery
    | GetVerifiableCredentialsByQueryHashQuery
>(
  request: DocumentNode,
  variables: V,
  ceramicProvider: CeramicProvider,
): Promise<Res[]> => {
  if (!ceramicProvider.client().did?.id) {
    await ceramicProvider.auth();
  }

  const client = ceramicProvider.client();

  const encryptedVerifiableCredentials: Res[] = [];

  let endCursor: string | undefined | null = '';
  let hasNextPage: boolean | undefined | null = false;

  do {
    const _variables: Record<string, unknown> = {
      ...variables,
      ...(endCursor && { after: endCursor }),
    };

    const { data, errors } = await client.execute<Res>(request, _variables);

    if (errors) {
      throw new TypeError(JSON.stringify(errors));
    }

    if (!data) {
      throw new TypeError('No data returned from Ceramic');
    }

    encryptedVerifiableCredentials.push(data);

    [endCursor, hasNextPage] = [
      data?.verifiableCredentialIndex?.pageInfo?.endCursor,
      data?.verifiableCredentialIndex?.pageInfo?.hasNextPage,
    ];
  } while (hasNextPage);

  return encryptedVerifiableCredentials;
};

export const getAuthenticatedCeramicProvider = async (
  pkHex?: string,
  serverURL?: string,
) => {
  let privateKeyHex = pkHex ?? '';

  if (!pkHex) {
    const identityStorage = await getItemFromStore(StorageKeys.identity);

    if (!identityStorage) {
      throw new Error('Identity not created yet');
    }

    privateKeyHex = identityStorage.privateKeyHex;
  }

  const ceramicProvider = new CeramicProvider(privateKeyHex, serverURL);

  await ceramicProvider.auth();

  return ceramicProvider;
};

export class VCManager {
  ceramicProvider: CeramicProvider;

  private saltedEntropy: string;

  constructor(ceramicProvider: CeramicProvider, saltedEntropy: string) {
    this.ceramicProvider = ceramicProvider;
    this.saltedEntropy = saltedEntropy;
  }

  static async create(pkHex?: string, serverURL?: string) {
    /**
     * Add some account-specific entropy to the input,
     * additional entropy will prevent someone from counting
     * the total number of credentials issued by some particular issuer
     */
    const entropy = await snap.request({
      method: 'snap_getEntropy',
      params: {
        version: 1,
        salt: _SALT,
      },
    });
    const saltedEntropy = entropy.startsWith('0x')
      ? entropy.substring(2)
      : entropy;

    return new VCManager(
      await getAuthenticatedCeramicProvider(pkHex, serverURL),
      saltedEntropy,
    );
  }

  private personalHashStr(str: string) {
    return sha256(Buffer.from(str + this.saltedEntropy));
  }

  public async getDecryptedVCsByQueryHash(
    queryHash: string,
  ): Promise<W3CCredential[]> {
    const client = this.ceramicProvider.client();

    if (!client.did?.id) {
      throw new TypeError('Client not authenticated');
    }

    const hashedOwnerDid = this.personalHashStr(client.did.id);

    const hashedQueryHash = this.personalHashStr(queryHash);

    const data = await loadAllCredentialsListPages<
      GetVerifiableCredentialsByQueryHashQueryVariables,
      GetVerifiableCredentialsByQueryHashQuery
    >(
      GetVerifiableCredentialsByQueryHash,
      {
        first: 1000,
        queryHash: hashedQueryHash,
        ownerDid: hashedOwnerDid,
      },
      this.ceramicProvider,
    );

    const executionResult = data
      .map((el) => el.verifiableCredentialIndex?.edges)
      .flat();

    return await Promise.all(
      executionResult.map(async (el) => {
        const encryptedVC = el?.node?.data as string;

        return await this.ceramicProvider.decrypt<W3CCredential>(encryptedVC);
      }),
    );
  }

  public async getDecryptedVCsByOffer(
    offer: SaveCredentialsRequestParams,
  ): Promise<W3CCredential[]> {
    const client = this.ceramicProvider.client();

    const ownerDid = client.did?.id;

    if (!ownerDid) {
      throw new TypeError('Client not authenticated');
    }

    const claimIds = getClaimIdsFromOffer(offer);

    const encryptedVCs = await Promise.all(
      claimIds.map(async (claimId) => {
        const hashedClaimId = this.personalHashStr(claimId);
        const hashedOwnerDid = this.personalHashStr(ownerDid);

        const data = await loadAllCredentialsListPages<
          GetVerifiableCredentialsByClaimIdQueryVariables,
          GetVerifiableCredentialsByClaimIdQuery
        >(
          GetVerifiableCredentialsByClaimId,
          {
            first: 1000,
            claimId: hashedClaimId,
            ownerDid: hashedOwnerDid,
          },
          this.ceramicProvider,
        );

        return data.map((el) => el.verifiableCredentialIndex?.edges).flat();
      }),
    );

    if (!encryptedVCs?.length) {
      return [];
    }

    return await Promise.all(
      encryptedVCs
        .filter((el) => el?.every((encryptedVC) => encryptedVC?.node?.data))
        .flat()
        .map(async (el) => {
          const encryptedVC = el?.node?.data as string;

          return await this.ceramicProvider.decrypt<W3CCredential>(encryptedVC);
        }),
    );
  }

  private async getPreparedVCFields(credential: W3CCredential) {
    const client = this.ceramicProvider.client();

    const ownerDid = client.did?.id;

    if (!ownerDid) {
      throw new TypeError('Client not authenticated');
    }

    const queryHash = hashVC(
      JSON.stringify(credential.type),
      credential.issuer,
      ownerDid,
    );

    const claimId = getClaimIdFromVC(credential);

    const [hashedOwnerDid, hashedQueryHash, hashedClaimId] = await Promise.all([
      this.personalHashStr(ownerDid),
      this.personalHashStr(queryHash),
      this.personalHashStr(claimId),
    ]);

    return {
      hashedOwnerDid,
      hashedQueryHash,
      hashedClaimId,
    };
  }

  public async clearVcs(credential: W3CCredential) {
    const client = this.ceramicProvider.client();

    const { hashedOwnerDid, hashedQueryHash } = await this.getPreparedVCFields(
      credential,
    );

    const data = await loadAllCredentialsListPages<
      GetVerifiableCredentialsByQueryHashQueryVariables,
      GetVerifiableCredentialsByQueryHashQuery
    >(
      GetVerifiableCredentialsByQueryHash,
      {
        first: 1000,
        queryHash: hashedQueryHash,
        ownerDid: hashedOwnerDid,
      },
      this.ceramicProvider,
    );

    const ids = data
      .map((el) => el.verifiableCredentialIndex?.edges)
      .flat()
      .map((el) => el?.node?.id ?? '')
      .filter((el) => Boolean(el));

    await Promise.all(
      ids.map(async (id) => {
        const { errors } = await client.execute<ClearVcMutation>(ClearVc, {
          id,
        } as ClearVcMutationVariables);

        if (errors) {
          throw new TypeError(JSON.stringify(errors));
        }
      }),
    );
  }

  public async encryptAndSaveVC(credential: W3CCredential) {
    const client = this.ceramicProvider.client();

    const {
      hashedOwnerDid,
      hashedQueryHash,
      hashedClaimId,
    } = await this.getPreparedVCFields(credential);

    const encryptedVC = await this.ceramicProvider.encrypt(credential);

    const createVCVariables: CreateVcMutationVariables = {
      input: {
        content: {
          ownerDid: hashedOwnerDid,
          data: encryptedVC,
          queryHash: hashedQueryHash,
          claimId: hashedClaimId,
        },
      },
    };

    const { errors } = await client.execute(CreateVc, createVCVariables);

    if (errors) {
      throw new TypeError(JSON.stringify(errors));
    }
  }

  public async getAllDecryptedVCs(): Promise<W3CCredential[]> {
    const ownerDid = this.ceramicProvider.client().did?.id;

    if (!ownerDid) {
      throw new TypeError('Client not authenticated');
    }

    const hashedOwnerDid = this.personalHashStr(ownerDid);

    const data = await loadAllCredentialsListPages<
      GetAllVerifiableCredentialsQueryVariables,
      GetAllVerifiableCredentialsQuery
    >(
      GetAllVerifiableCredentials,
      {
        first: 1000,
        ownerDid: hashedOwnerDid,
      },
      this.ceramicProvider,
    );

    const executionResult = data
      .map((el) => el.verifiableCredentialIndex?.edges)
      .flat();

    if (!executionResult?.length) {
      return [];
    }

    return await Promise.all(
      executionResult.map(async (el) => {
        const encryptedVC = el?.node?.data as string;

        return await this.ceramicProvider.decrypt<W3CCredential>(encryptedVC);
      }),
    );
  }

  public async getDecryptedVCsByQuery(
    query: ProofQuery,
    issuerDiD: string,
  ): Promise<W3CCredential[]> {
    const ownerDid = this.ceramicProvider.client().did?.id;

    if (!ownerDid) {
      throw new TypeError('Client not authenticated');
    }

    const queryHash = hashVC(String(query.type), issuerDiD, ownerDid);

    return this.getDecryptedVCsByQueryHash(queryHash);
  }
}

export const moveStoreVCtoCeramic = async () => {
  const credentials = (await getItemFromStore(StorageKeys.credentials)) || [];

  const vcManager = await VCManager.create();

  if (credentials.length) {
    await Promise.all(
      credentials.map(async (credential: W3CCredential) => {
        await vcManager.encryptAndSaveVC(credential);
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

export const isVCsV2 = (vcs: W3CCredential[]) => {
  return vcs.every((vc) => {
    return vc.issuer.includes('readonly');
  });
};
