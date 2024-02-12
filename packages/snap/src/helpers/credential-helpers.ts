import { Claim } from '@iden3/js-iden3-core';
import { sha256 } from 'ethers/lib/utils';
import { DocumentNode } from 'graphql/language';
import type {
  CreateProofRequestParams,
  ProofQuery,
} from '@rarimo/rarime-connector';
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
  RevocationStatus,
  W3CCredential,
  GetVerifiableCredentialsByClaimIdAndQueryHashQueryVariables,
  GetVerifiableCredentialsByClaimIdAndQueryHashQuery,
  GetVerifiableCredentialsByClaimIdAndQueryHash,
} from '../types';
import { getItemFromStore, setItemInStore } from '../rpc';
import VerifiableRuntimeCompositeV2 from '../../ceramic/composites/VerifiableCredentialsV2-runtime.json';
import VerifiableRuntimeComposite from '../../ceramic/composites/VerifiableCredentials-runtime.json';
import { Identity } from '../identity';
import { getCoreClaimFromProof } from './proof-helpers';
import { CeramicProvider } from './ceramic-helpers';
import { genPkHexFromEntropy } from './identity-helpers';

const _SALT = 'pu?)Rx829U3ot.iB)D+z9Iyh';

export const hashVC = (type: string, issuerDid: string, ownerDid: string) => {
  return sha256(Buffer.from(issuerDid + type + ownerDid));
};

export const getClaimIdFromVCId = (vcId: string) => {
  try {
    const claimIdUrl = new URL(vcId);

    const pathNameParts = claimIdUrl.pathname.split('/');

    return pathNameParts[pathNameParts.length - 1];
  } catch (error) {
    return vcId;
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
  opts: { definition: object; serverURL?: string },
  pkHex: string,
) => {
  const ceramicProvider = CeramicProvider.create(pkHex, {
    ...(opts.serverURL && { serverURL: opts.serverURL }),
    definition: opts.definition,
  });

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

  static async create(opts?: {
    saltedEntropy?: string;
    pkHex?: string;
    definition?: object;
    serverURL?: string;
  }) {
    let privateKeyHex = opts?.pkHex;

    if (!privateKeyHex) {
      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (!identityStorage) {
        throw new Error('Identity not created yet');
      }

      privateKeyHex = identityStorage.privateKeyHex;
    }

    if (!privateKeyHex) {
      throw new Error('Private key is not defined');
    }

    /**
     * Add some account-specific entropy to the input,
     * additional entropy will prevent someone from counting
     * the total number of credentials issued by some particular issuer
     */
    const saltedEntropy = opts?.saltedEntropy ?? privateKeyHex;

    const definition = opts?.definition ?? VerifiableRuntimeCompositeV2;

    return new VCManager(
      await getAuthenticatedCeramicProvider(
        {
          ...(opts?.serverURL && { serverURL: opts.serverURL }),
          definition,
        },
        privateKeyHex,
      ),
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

  public async getDecryptedVCsByOfferAndQuery(
    claimOffer: SaveCredentialsRequestParams,
    { query, issuerDid }: CreateProofRequestParams,
  ) {
    const client = this.ceramicProvider.client();

    const ownerDid = client.did?.id;

    if (!ownerDid) {
      throw new TypeError('Client not authenticated');
    }

    const claimIds = getClaimIdsFromOffer(claimOffer);
    const queryHash = hashVC(JSON.stringify(query.type), issuerDid, ownerDid);

    const hashedQueryHash = this.personalHashStr(queryHash);

    const encryptedVCs = await Promise.all(
      claimIds.map(async (claimId) => {
        const hashedClaimId = this.personalHashStr(claimId);
        const hashedOwnerDid = this.personalHashStr(ownerDid);

        const data = await loadAllCredentialsListPages<
          GetVerifiableCredentialsByClaimIdAndQueryHashQueryVariables,
          GetVerifiableCredentialsByClaimIdAndQueryHashQuery
        >(
          GetVerifiableCredentialsByClaimIdAndQueryHash,
          {
            first: 1000,
            claimId: hashedClaimId,
            ownerDid: hashedOwnerDid,
            queryHash: hashedQueryHash,
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

  public async getDecryptedVCsByOffer(
    offer: SaveCredentialsRequestParams,
  ): Promise<W3CCredential[]> {
    const claimIds = getClaimIdsFromOffer(offer);

    return this.getDecryptedVCsByClaimIds(claimIds);
  }

  public async getDecryptedVCsByClaimIds(
    claimIds: string[],
  ): Promise<W3CCredential[]> {
    const client = this.ceramicProvider.client();

    const ownerDid = client.did?.id;

    if (!ownerDid) {
      throw new TypeError('Client not authenticated');
    }

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

    const claimId = getClaimIdFromVCId(credential.id);

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

  /*
  save vc & clear vc methods have similar ways to build query hash for ceramic compose db.
  If VCs with specific queryHash had been found - we return them instead of generating new ones.

  But in cases, when the issuer has migrations,
  or some other `VC's changing situations - it could still return the same query hash,
  but other necessary data could be outdated.

  To deal with that, specific checks had been added to remove all matched VC's from ceramic, and save new ones
  * */
  public async clearMatchedVcs(credential: W3CCredential) {
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

    const queryHash = hashVC(JSON.stringify(query.type), issuerDiD, ownerDid);

    return this.getDecryptedVCsByQueryHash(queryHash);
  }
}

export const migrateVCsToLastCeramicModel = async () => {
  const targetVcManager = await VCManager.create();

  const targetVcs = await targetVcManager.getAllDecryptedVCs();

  if (targetVcs.length) {
    return;
  }

  const entropyKeyHex = await genPkHexFromEntropy();

  const entropyIdentity = await Identity.create(entropyKeyHex);

  const identityStorage = await getItemFromStore(StorageKeys.identity);

  const isPKImported =
    identityStorage.privateKeyHex === entropyIdentity.privateKeyHex;

  if (isPKImported) {
    return;
  }

  const saltedEntropyHex = await genPkHexFromEntropy(_SALT);

  const oldKeyHexManager = await VCManager.create({
    saltedEntropy: saltedEntropyHex,
    pkHex: entropyKeyHex,
  });

  const oldKeyHexVCs = await oldKeyHexManager.getAllDecryptedVCs();

  const storeCredentials: W3CCredential[] =
    (await getItemFromStore(StorageKeys.credentials)) || [];

  await Promise.all(
    [VerifiableRuntimeComposite].map(async (definition) => {
      const vcManager = await VCManager.create({
        definition,
      });

      const ceramicVCs = await vcManager.getAllDecryptedVCs();

      const vcs = [...storeCredentials, ...ceramicVCs, ...oldKeyHexVCs].reduce(
        (acc, vc) => {
          const isVcExist = Boolean(
            acc.find((el) => {
              const elId = getClaimIdFromVCId(el.id);
              const vcId = getClaimIdFromVCId(vc.id);

              return elId === vcId;
            }),
          );

          return [...acc, ...(isVcExist ? [] : [vc])];
        },
        [] as W3CCredential[],
      );

      await Promise.all(
        vcs.map(async (vc) => {
          await targetVcManager.encryptAndSaveVC(vc);
        }),
      );

      await setItemInStore(StorageKeys.credentials, []);
    }),
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

export const isVCsV2 = (vcs: W3CCredential[]) => {
  return vcs.every((vc) => {
    return vc.issuer.includes('readonly');
  });
};
