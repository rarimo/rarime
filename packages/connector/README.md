# RariMe Connector

RariMe connector is used to install snap and exposes methods for calling snap on dApps and other applications.

## Getting started

### Installation
```bash
npm install @rarimo/rarime-connector
```

```bash
yarn add @rarimo/rarime-connector
```

### Create a snap connector instance
```typescript
import { ZkpSnap } from '@rarimo/rarime-connector'

export const zkpSnap = new ZkpSnap()
```

### Establish connection
```typescript
await zkpSnap.enable()
```

### Check connection status
```typescript
const isInstalled = await zkpSnap.isInstalled()
```

### Additional helpers
```typescript
import { isMetamaskInstalled } from '@rarimo/rarime-connector'

const init = async () => {
  const isInstalled = await isMetamaskInstalled()

  if (isInstalled) {
    // ...
  }
}
```

## ZKP quick examples

```typescript
import { ZkpSnap } from '@rarimo/rarime-connector'

const zkpSnap = new ZkpSnap()

await zkpSnap.enable()

// Create an identity
const { identityIdString, identityIdBigIntString } = await zkpSnap.createIdentity()

console.log(identityIdString, identityIdBigIntString)

// import identity
const { identityIdString, identityIdBigIntString } = await zkpSnap.createIdentity({
  privateKeyHex: '0x...'
})

console.log(identityIdString, identityIdBigIntString)

// Show private key hex in metamask dialog
await zkpSnap.exportIdentity()

const { identityIdString, identityIdBigIntString } = await zkpSnap.getIdentity()
console.log(identityIdString, identityIdBigIntString)

// Get your claim offer, for example from issuer api
const claimOffer: SaveCredentialsRequestParams = await api.get(`/example/issuer/api/${identityIdString}/[claim-type]`);

// Or use query based request to find VC
const proofRequest: CreateProofRequestParams = {
  circuitId: CircuitId.AtomicQueryMTPV2OnChain,
  accountAddress: 'your_metamask_address' as string,
  issuerDid: '...',

  query: {
    allowedIssuers: ['*'],
    credentialSubject: {
      yourProperty: {
        $eq: 1,
      },
    },
    type: ['VerifiableCredential', 'YourCredentialType'],
  },
};

const { type, issuer } = await zkpSnap.checkCredentialExistence({
  claimOffer,
  proofRequest,
})

console.log(type, issuer)

// generate VC and save to user private store
const { type, issuer } = await zkpSnap.saveCredentials(claimOffer)

await zkpSnap.removeCredentials()

const vcs = await zkpSnap.getCredentials()

console.log(vcs);

// Check if state contract on Rarimo chain is synced with the lightweight state contract on current chain
const isStateSynced = await zkpSnap.checkStateContractSync()

// Find credentials by `query`, Generate Proof and return proof data within state update details if it necessary
const {
  updateStateDetails,
  updateStateTx,
  zkpProof,
  statesMerkleData,
} = await zkpSnap.createProof(proofRequest)

```
