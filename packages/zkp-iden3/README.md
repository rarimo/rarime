# @rarimo/zkp-iden3

Package to generate zero-knowledge proofs for the Iden3 protocol.

![version (scoped package)](https://badgen.net/npm/v/@rarimo/zkp-iden3)
![types](https://badgen.net/npm/types/@rarimo/zkp-iden3)
![tree-shaking](https://badgen.net/bundlephobia/tree-shaking/@rarimo/zkp-iden3)
![checks](https://badgen.net/github/checks/rarimo/rarime/main)

## Introduction

`@rarimo/zkp-iden3` is a library that provides strict set of tools to work with `iden3` protocol. It allows to create an identity, get Verifiable Credentials and generate a proof and verify it.

## Getting Started

### Installation

```
yarn add @rarimo/zkp-iden3
```

### Creating Identity

```ts
import { Identity } from '@rarimo/zkp-iden3';

const PK = 'your_private_key';
const AUTH_BJJ_CREDENTIAL_HASH = 'cca3371a6cb1b715004407e325bd993c';
const ID_TYPE = Uint8Array.from([1, 0]);

const identity = Identity.create(
  {
    idType: ID_TYPE,
    schemaHashHex: AUTH_BJJ_CREDENTIAL_HASH,
  },
  PK,
);
```

### Generate Auth Proof and getting VerifiableCredentials

Note, that you should already have a `ClaimOffer`, which `issuer` issued to you.

```ts
import { AuthZkp } from '@rarimo/zkp-iden3';

const chainInfo: ChainZkpInfo = {
  targetChainId: 11155111,
  targetRpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
  targetStateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',

  rarimoApiUrl: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
  rarimoEvmRpcApiUrl: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
  rarimoStateContractAddress: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',

  rarimoNetworkType: 'beta',
};

const authZkp = new AuthZkp(identity, offer, {
  chainInfo,
  circuitsUrls: {
    wasmUrl:
      'https://ipfs.tokend.io/ipfs/ipfs/QmYd41GHrKQLqbk96zHbmHU5rGVcxwmAgBpRqLCGLK7LQu',
    keyUrl:
      'https://ipfs.tokend.io/ipfs/ipfs/QmWKor7i9r2zbM6oqSdgPUCvgyYESH39qXk1f5tbdeaAg7',
  },
});

vcs = await authProof.getVerifiableCredentials(); // W3CCredential[]
```

### Generate Proof

```ts
const did = parseDidV2(vcs[0].issuer);

const issuerId = DID.idFromDID(did);

const issuerHexId = `0x0${issuerId.bigInt().toString(16)}`;

const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
  `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
  chainInfo.rarimoApiUrl,
);

const operation = await getCoreOperationByIndex(
  chainInfo,
  stateData.state.lastUpdateOperationIndex,
);

const zkpGen = new ZkpGen(
  identity,
  {
    circuitId: CircuitId.AtomicQueryMTPV2OnChain,
    accountAddress: '0x...',

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
);

const zkpProof = await zkpGen.generateProof(
  stateData.state.hash,
  operation.operation.details.GISTHash,
);
```

## Known Issues

Just because `iden3` libraries is developed for node, you need to follow next steps in your client:

First thing first, add the following packages to your project, because it marked as `peerDependencies`:

```bash
yarn add util ejc snarkjs @iden3/js-iden3-core @iden3/js-jwz @iden3/js-crypto @iden3/js-jsonld-merklization
```

Then, ddd this aliases to your client app build config, especially if you are using ViteJs

```ts
[
  { find: 'util', replacement: '[path/to/node_modules]/util/util.js' },
  { find: 'ejc', replacement: '[path/to/node_modules]/ejs/ejs.min.js' },
  {
    find: 'snarkjs',
    replacement: '[path/to/node_modules]/snarkjs/build/snarkjs.min.js',
  },
  {
    find: '@iden3/js-iden3-core',
    replacement:
      '[path/to/node_modules]/@iden3/js-iden3-core/dist/browser/esm/index.js',
  },
  {
    find: '@iden3/js-jwz',
    replacement:
      '[path/to/node_modules]/@iden3/js-jwz/dist/browser/esm/index.js',
  },
  {
    find: '@iden3/js-crypto',
    replacement:
      '[path/to/node_modules]/@iden3/js-crypto/dist/browser/esm/index.js',
  },
  {
    find: '@iden3/js-jsonld-merklization',
    replacement:
      '[path/to/node_modules]/@iden3/js-jsonld-merklization/dist/browser/esm/index.js',
  },
];
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](../../LICENSE) file for details
