import { DID } from '@iden3/js-iden3-core'
import {
  type ChainZkpInfo,
  // checkIfStateSynced,
  CircuitId,
  getCoreOperationByIndex,
  type GetStateInfoResponse,
  loadDataFromRarimoCore,
  // type MerkleProof,
  type SaveCredentialsRequestParams,
  type W3CCredential,
} from '@rarimo/rarime-connector'

import { AuthZkp, Identity, parseDidV2, ZkpGen } from '../src'

const PK = 'c5f1c3e6db9204b037841005c183ee605e69683ca1fec67ac87db86f6639724b'

const userDid = 'did:iden3:readonly:tQJ8hwYwVr6M7JDVZLMrSjpi9DDistyDaBofjB6XY'

const AUTH_BJJ_CREDENTIAL_HASH = 'cca3371a6cb1b715004407e325bd993c'
const ID_TYPE = Uint8Array.from([1, 0])

const offer: SaveCredentialsRequestParams = {
  body: {
    Credentials: [
      {
        description: 'urn:uuid:6dff4518-5177-4f39-af58-9c156d9b6309',
        id: '3dc7608e-dbce-11ee-b1f8-220bd8de42d4',
      },
    ],
    url: 'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/agent',
  },
  from: 'did:iden3:readonly:tLd8sbb1xTSvi2wtRF4TUVcfDUr8ppYMohLqjhGQT',
  id: 'c4960a88-73ae-44b2-b6d5-e8326bd41521',
  threadID: 'c4960a88-73ae-44b2-b6d5-e8326bd41521',
  to: 'did:iden3:readonly:tQJ8hwYwVr6M7JDVZLMrSjpi9DDistyDaBofjB6XY',
  typ: 'application/iden3comm-plain-json',
  type: 'https://iden3-communication.io/credentials/1.0/offer',
}

const chainInfo: ChainZkpInfo = {
  targetChainId: 11155111,
  targetRpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
  targetStateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',

  rarimoApiUrl: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
  rarimoEvmRpcApiUrl: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
  rarimoStateContractAddress: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',

  rarimoNetworkType: 'beta',
}

describe('zkp flow', () => {
  let vcs: W3CCredential[]

  const getIdentity = async () => {
    return Identity.create(
      {
        idType: ID_TYPE,
        schemaHashHex: AUTH_BJJ_CREDENTIAL_HASH,
      },
      PK,
    )
  }

  it('should create identity', async () => {
    const identity = await getIdentity()

    expect(identity.didString).toBe(userDid)
  })

  it('should get VC', async () => {
    const identity = await getIdentity()

    const authProof = new AuthZkp(identity, offer, {
      chainInfo,
      circuitsUrls: {
        wasmUrl:
          'https://ipfs.tokend.io/ipfs/ipfs/QmYd41GHrKQLqbk96zHbmHU5rGVcxwmAgBpRqLCGLK7LQu',
        keyUrl:
          'https://ipfs.tokend.io/ipfs/ipfs/QmWKor7i9r2zbM6oqSdgPUCvgyYESH39qXk1f5tbdeaAg7',
      },
    })

    vcs = await authProof.getVerifiableCredentials()

    expect(vcs[0].id.includes(offer.body.Credentials[0].id)).toBe(true)
  })

  it('should create proof', async () => {
    const identity = await getIdentity()

    // const isSynced = await checkIfStateSynced(chainInfo)

    const did = parseDidV2(vcs[0].issuer)

    const issuerId = DID.idFromDID(did)

    const issuerHexId = `0x0${issuerId.bigInt().toString(16)}`

    const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
      `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
      chainInfo.rarimoApiUrl,
    )
    // const merkleProof = await loadDataFromRarimoCore<MerkleProof>(
    //   `/rarimo/rarimo-core/identity/state/${issuerHexId}/proof`,
    //   chainInfo.rarimoApiUrl,
    //   stateData.state.createdAtBlock,
    // )

    const operation = await getCoreOperationByIndex(
      chainInfo,
      stateData.state.lastUpdateOperationIndex,
    )

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
        chainInfo,
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
    )

    const zkpProof = await zkpGen.generateProof(
      stateData.state.hash,
      operation.operation.details.GISTHash,
    )

    expect(zkpProof).not.toBeNull()
  })
})
