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

### Establish connection
```typescript
import { ZkpSnap } from '@rarimo/rarime-connector'

const zkpSnap = new ZkpSnap()

await zkpSnap.enable()
```

### Create/import identity
```typescript
// Create an identity
const { identityIdString, identityIdBigIntString } = await zkpSnap.createIdentity()

console.log(identityIdString, identityIdBigIntString)

// or import identity
const { identityIdString, identityIdBigIntString } = await zkpSnap.createIdentity({
  privateKeyHex: '0x...'
})

console.log(identityIdString, identityIdBigIntString)
```

### Show private key in metamask dialog
```typescript
await zkpSnap.exportIdentity()
```

### Get identity pubKey and it's bigInt representation
```typescript
const { identityIdString, identityIdBigIntString } = await zkpSnap.getIdentity()
console.log(identityIdString, identityIdBigIntString)
```

### Check Verifiable Credentials existence or save new one to the private store
If you want to save Verifiable Credentials to private store, then first things first get your `ClaimOffer`, for example from issuer api.

`claimOffer` - is a `challenge` for generating AuthV2 proof
```typescript
const claimOffer: SaveCredentialsRequestParams = await api.get(`/example/issuer/api/${identityIdString}/[claim-type]`);
```

After that, you can save Verifiable Credential to the private store
```typescript
const { type, issuer } = await zkpSnap.saveCredentials(claimOffer)
```

Or if you sure, that you have a saved Verifiable Credential in your private store, you can use query based request to ensure that it exists
```typescript
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
```

### Remove Verifiable Credentials from the private store
```typescript
await zkpSnap.removeCredentials({
  ids: ['id1', 'id2'],
})
```

### Get All Verifiable Credentials
```typescript
const vcs = await zkpSnap.getCredentials()
console.log(vcs);
```

#### important!
Note that calling `removeCredentials` and `getCredentials` methods in `@rarimo/rarime` snap are stricted to domain origins whitelist

### Check if state contract on Rarimo chain is synced with the lightweight state contract on current connected chain in metamask
```typescript
const isStateSynced = await zkpSnap.checkStateContractSync()
```

### Find credentials by `query`, Generate Proof and return proof data within state update details if it necessary
```typescript
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
}

const {
  updateStateDetails,
  updateStateTx,
  zkpProof,
  statesMerkleData,
} = await zkpSnap.createProof(proofRequest)

```
