import { DID } from '@iden3/js-iden3-core';
import {
  // checkIfStateSynced,
  CircuitId,
  getCoreOperationByIndex,
  type GetStateInfoResponse,
  loadDataFromRarimoCore,
  // type MerkleProof,
  type SaveCredentialsRequestParams,
  type W3CCredential,
} from '@rarimo/rarime-connector';

import { parseDidV2 } from '../helpers';

import { AuthZkp, Identity, ZkpGen } from '../instances';

const issuerApi = 'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com';
const AUTH_BJJ_CREDENTIAL_HASH = 'cca3371a6cb1b715004407e325bd993c';
const ID_TYPE = Uint8Array.from([1, 0]);
const chainInfo = {
  targetChainId: 11155111,
  targetRpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
  targetStateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',

  rarimoApiUrl: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
  rarimoEvmRpcApiUrl: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
  rarimoStateContractAddress: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',

  rarimoNetworkType: 'beta',
};
const MINUTE = 60 * 1000;

// ===============================================================================================

const PK = '9a5305fa4c55cbf517c99693a7ec6766203c88feab50c944c00feec051d5dab7';

let offer: SaveCredentialsRequestParams;

describe('zkp flow', () => {
  let vcs: W3CCredential[];

  const getIdentity = async () => {
    return Identity.create(
      {
        idType: ID_TYPE,
        schemaHashHex: AUTH_BJJ_CREDENTIAL_HASH,
      },
      PK,
    );
  };

  it(
    'should create identity',
    async () => {
      const identity = await getIdentity();

      expect(identity.didString).not.toBeNull();
    },
    MINUTE,
  );

  it('should get offer', async () => {
    const identity = await getIdentity();

    const CLAIM_TYPE = 'urn:uuid:6dff4518-5177-4f39-af58-9c156d9b6309';

    const response = await fetch(
      `${issuerApi}/v1/credentials/${identity.didString}/${CLAIM_TYPE}`,
    );

    offer = await response.json();

    expect(offer.to.toLowerCase()).toEqual(identity.didString.toLowerCase());
  });

  it(
    'should get VC',
    async () => {
      const identity = await getIdentity();

      const authProof = new AuthZkp(identity, offer, {
        coreEvmRpcApiUrl: chainInfo.rarimoEvmRpcApiUrl,
        coreStateContractAddress: chainInfo.rarimoStateContractAddress,
        circuitsUrls: {
          wasmUrl:
            'https://ipfs.tokend.io/ipfs/ipfs/QmYd41GHrKQLqbk96zHbmHU5rGVcxwmAgBpRqLCGLK7LQu',
          keyUrl:
            'https://ipfs.tokend.io/ipfs/ipfs/QmWKor7i9r2zbM6oqSdgPUCvgyYESH39qXk1f5tbdeaAg7',
        },
      });

      vcs = await authProof.getVerifiableCredentials();

      expect(vcs[0].id.includes(offer.body.Credentials[0].id)).toBe(true);
    },
    MINUTE * 5,
  );

  it(
    'should create proof',
    async () => {
      const identity = await getIdentity();

      // const isSynced = await checkIfStateSynced(chainInfo)

      const did = parseDidV2(vcs[0].issuer);

      const issuerId = DID.idFromDID(did);

      const issuerHexId = `0x0${issuerId.bigInt().toString(16)}`;

      const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
        `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
        chainInfo.rarimoApiUrl,
      );
      // const merkleProof = await loadDataFromRarimoCore<MerkleProof>(
      //   `/rarimo/rarimo-core/identity/state/${issuerHexId}/proof`,
      //   chainInfo.rarimoApiUrl,
      //   stateData.state.createdAtBlock,
      // )

      const operation = await getCoreOperationByIndex(
        chainInfo.rarimoApiUrl,
        stateData.state.lastUpdateOperationIndex,
      );

      const zkpGen = new ZkpGen(
        identity,
        {
          circuitId: CircuitId.AtomicQueryMTPV2OnChain,
          accountAddress: '0xEA931A38726546cB7B5992483867387fC9FAdF7b',

          query: {
            allowedIssuers: ['*'],
            credentialSubject: {
              isNatural: {
                $eq: 1,
              },
            },
            type: [vcs[0].type[1]],
          },
        },
        vcs[0],
        {
          coreEvmRpcApiUrl: chainInfo.rarimoEvmRpcApiUrl,
          coreStateContractAddress: chainInfo.rarimoStateContractAddress,
          circuitsUrls: {
            [CircuitId.AtomicQuerySigV2]: {
              wasmUrl:
                'https://storage.googleapis.com/rarimo-store/snap/QmYB5QLvH5ihiedxvzkG3XPQngjxcS8wc1xCAoKnGS5GfC',
              keyUrl:
                'https://storage.googleapis.com/rarimo-store/snap/QmeXxRXxYGCwa48ANikH5Knzi9cgkmhumPbMtjTKNYkThL',
            },
            [CircuitId.AtomicQueryMTPV2]: {
              wasmUrl:
                'https://storage.googleapis.com/rarimo-store/snap/QmRqGgnN6Qy4LuPxQKH2wrADNe4aJb8wYJhS1ky9zbLS8t',
              keyUrl:
                'https://storage.googleapis.com/rarimo-store/snap/QmcLyDLPWJpyEWeR9KkWQuGHAqifnwpDAWBX1R6a7g6F6a',
            },
            [CircuitId.AtomicQuerySigV2OnChain]: {
              wasmUrl:
                'https://storage.googleapis.com/rarimo-store/snap/QmS4vURQ1c8tgALSokdTYVqx5E9FmASbu964W3JevnM3B4',
              keyUrl:
                'https://storage.googleapis.com/rarimo-store/snap/QmT45Y62hfZnADq6VvKGjNR8foNb2KjcyG4AStRRAN9iHm',
            },
            [CircuitId.AtomicQueryMTPV2OnChain]: {
              wasmUrl:
                'https://ipfs.tokend.io/ipfs/ipfs/QmPtPiFgZigau2VNpSCoagNj36ZpuuATRNvyNPAvvUgvq6',
              keyUrl:
                'https://ipfs.tokend.io/ipfs/ipfs/QmU8fC3xwjMcmnsB88SrdKRZpskhxUwBRnaLMa1AcN9ERj',
            },
          },
        },
      );

      const zkpProof = await zkpGen.generateProof(
        stateData.state.hash,
        operation.operation.details.GISTHash,
      );

      expect(zkpProof).not.toBeNull();
    },
    MINUTE * 5,
  );
});
