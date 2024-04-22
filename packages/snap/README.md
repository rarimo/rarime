# RariMe

RariMe is a MetaMask Snap that safely holds any of your credentials and allows you to prove your identity without revealing any personal data. Powered by Rarimo Protocol and Zero-Knowledge Proof technology.

## Methods

### Create an identity

To create an identity you need to call this method:

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: { method: 'create_identity' },
  },
});
```

### Get identity

Returns DID and DID in big int string format if they are exists, otherwise method throws error.

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: { method: 'get_identity' },
  },
});
```

### Export identity

To export an identity you need to call this method:

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: { method: 'export_identity' },
  },
});
```

### Save Verifiable Credentials

To save Verifiable Credentials you need to call this method with params:

```javascript
import { CORE_CHAINS } from '@rarimo/rarime-connector';

const coreChain = CORE_CHAINS['rarimo_42-1'];

const claimOffer = {
  body: {
    credentials: [
      {
        description: 'Natural Person',
        id: '86531650-023c-4c6c-a437-a82e137ead68',
      },
    ],
    url: 'http://127.0.0.1:8000/integrations/issuer/v1/public/claims/offers/callback',
  },
  from: 'did:iden3:tJnRoZ1KqUPbsfVGrk8io51iqoRc5dGhj5LLMHSrD',
  id: '026035f6-42f6-4a2d-b516-0b11d2674850',
  thid: '348b7198-7cb1-46f4-bc0a-98a358f65539',
  to: 'did:iden3:tTxif8ahrSqRWavS8Qatrp4ZEJvPdu3ELSMgqTEQN',
  typ: 'application/iden3comm-plain-json',
  type: 'https://iden3-communication.io/credentials/1.0/offer',
};

await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: {
      method: 'save_credentials',
      params: [coreChain, claimOffer],
    },
  },
});
```

where:

- **chainInfo** - `cosmos` - type chain details, `rarime-connector` has it's default chains, where `issuer` has been deployed, but in case you have deployed `issuer` on your own cosmos node - you can define `ChainInfo`
- **claimOffer**:
  - **id**: request identifier
  - **thid**: ID of the message thread
  - **from**: identifier of the person from whom the offer was received
  - **to**: identifier of the person who received the offer
  - **typ**: media type of the message. In our case, it is the type of the protocol of the packed message application/iden3comm-plain-json
  - **type**: type of iden3comm protocol message
  - **body**
    - **credentials[0]**
      - **description**: description of the schema
      - **id**: credential id
    - **url**: URL to which requested information is sent and response is received

### Remove Verifiable Credentials

```javascript
return await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    request: {
      method: 'remove_credentials',
      params: {
        ids: [
          'https://example.issuer.node.api.com/v1/credentials/86531650-023c-4c6c-a437-a82e137ead68',
        ],
      },
    },
    snapId: 'local:http://localhost:8081',
  },
});
```

where:

- **ids**: list of claim ids to remove, e. g. `W3CCredential.id`

### Create a proof

Make sure you are on the correct network before creating a proof!
Returns ZKProof for off-chain and updateStateTx, statesMerkleData, ZKProof for on-chain
To create a proof you need to call this method with params:

```javascript
import { CORE_CHAINS, TARGET_CHAINS } from '@rarimo/rarime-connector';

const coreChain = CHAINS['rarimo_42-1'];
const targetChain = SUPPORTED_CHAINS['11155111']; // Sepolia chain
const createProofRequestParams = {
  circuitId: 'credentialAtomicQuerySigV2OnChain',
  issuerDid: 'did:iden3:[...]',
  accountAddress: '0x......',
  challenge: '1251760352881625298994789945427452069454957821390', // BigInt string
  query: {
    allowedIssuers: ['*'],
    credentialSubject: {
      isNatural: {
        $eq: 1,
      },
    },
    type: 'IdentityProviders',
  },
};

await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: {
      method: 'create_proof',
      params: [coreChain, targetChain, createProofRequestParams],
    },
  },
});
```

where:

- **chainInfo** - `cosmos` - type chain details, `rarime-connector` has it's default chains, where `issuer` has been deployed, but in case you have deployed `issuer` on your own cosmos node - you can define `ChainInfo`
- **chainZkpInfo** - `evm` - type chain details, where [`LightweightState contract`](https://github.com/rarimo/identity-contracts/blob/master/contracts/LightweightState.sol) has been deployed
- **createProofRequestParams**:
  - **circuitId**: type of proof
  - **accountAddress**(optional): Metamask user address for onchain proofs
  - **issuerDid**: did of the issuer trusted by the verifier
  - **challenge**(optional): text that will be signed
  - **query**
    - **allowedIssuers**: types of issuers allowed
      - **\***: all types of Issuers are allowed
    - **context**: URL for getting the vocabulary for the credential
    - **type**: type of credentials allowed
    - **credentialSubject**: query request to a query circuit

### Check state contract

Returns `true` if the state contract on current chain need to be synced:

```javascript
import { CORE_CHAINS, TARGET_CHAINS } from '@rarimo/rarime-connector';

const coreChain = CHAINS['rarimo_42-1'];
const targetChain = SUPPORTED_CHAINS['11155111']; // Sepolia chain

await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: {
      method: 'check_state_contract_sync',
      params: [coreChain, targetChain],
    },
  },
});
```

where:

- **chainInfo** - `cosmos` - type chain details, `rarime-connector` has it's default chains, where `issuer` has been deployed, but in case you have deployed `issuer` on your own cosmos node - you can define `ChainInfo`
- **chainZkpInfo** - `evm` - type chain details, where [`LightweightState contract`](https://github.com/rarimo/identity-contracts/blob/master/contracts/LightweightState.sol) has been deployed

### Get Verifiable Credentials

- Only supported domains

Return a list of Verifiable Credentials:

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'snapId',
    request: {
      method: 'get_credentials',
    },
  },
});
```

## Testing

The snap comes with some basic tests, to demonstrate how to write tests for
snaps. To test the snap, run `yarn test` in this directory. This will use
[`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest)
to run the tests in `src/index.test.ts`.

## Development

## Prepare ceramic json files and deploy (example)

### Prerequisites

First things first, follow steps on Ceramic composeDB [guide](https://developers.ceramic.network/docs/composedb/set-up-your-environment#setup) to prepare environment and get `CERAMIC_URL` with `DID_PRIVATE_KEY` variables.

### Run script to prepare json files

```bash
CERAMIC_URL=http://... DID_PRIVATE_KEY=fbb8731ecc9c36542f9caf9d9e3535c8... yarn workspace @rarimo/rarime ceramic:prepare-vc
```

### Run Graphql server locally

```bash
CERAMIC_URL=http://... DID_PRIVATE_KEY=fbb8731ecc9c36542f9caf9d9e3535c8... yarn workspace @rarimo/rarime ceramic:graphql-server
```

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with
  the CLI, `transpilationMode` must be set to `localOnly` (default) or
  `localAndDeps`.
