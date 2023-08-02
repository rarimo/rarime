# Metamask Snap Connector

MetaMask Snap connector is used to install snap and exposes methods for calling snap on dApps and other applications.

## Usage

Adapter has an exposed function for installing the snap.

```typescript
async function enableSnap(
  snapOrigin?: string,
  version?: string,
): Promise<MetamaskSnap>
```

After snap installation, this function returns `MetamaskSnap` object that can be used to retrieve snap connector.
An example of initializing snap and invoking snap connector is shown below.

```typescript
// install snap and get connector
const snap = await enableSnap();
const connector = await snap.getConnector();

// invoke connector
const identity = await connector.createIdentity();

console.log(`Snap installed, identity created: ${identity}`);
```

For ease of use, the connector package also exposes this functions:

```typescript
isMetamaskInstalled(): boolean
isMetamaskFlask(): Promise<boolean>
isSnapInstalled(snapOrigin?: string, version?: string): Promise<boolean>
```

## Connector Methods
### Create an identity
To create an identity you need to call this method:
```typescript
createIdentity(): Promise<string>
```
Returns DID.

### Save Verifiable Credentials
To save Verifiable Credentials you need to call this method with params:
```typescript
saveCredentials(params: SaveCredentialsRequestParams): Promise<W3CCredential[]>
```
```typescript
type SaveCredentialsRequestParams = {
  body: {
    credentials: [
      {
        description: string;
        id: string;
      },
    ];
    url: string;
  };
  from: string;
  id: string;
  thid?: string;
  to: string;
  typ?: string;
  type: string;
};
```

Returns all Verifiable Credentials saved inside the snap state
```typescript
type W3CCredential = {
  id: string;
  '@context': string[];
  type: string[];
  expirationDate?: string;
  issuanceDate?: string;
  credentialSubject: { [key: string]: object | string | number };
  credentialStatus: CredentialStatus;
  issuer: string;
  credentialSchema: CredentialSchema;
  proof?: { [key: string]: any } | any[];
};

type CredentialStatus = {
  id: string;
  type: string;
  revocationNonce?: number;
  statusIssuer?: CredentialStatus;
};

type CredentialSchema = {
  id: string;
  type: string;
};
```

### Create a proof
To create a proof you need to call this method with params:

```typescript
createProof(params: CreateProofRequestParams): Promise<ZKProof>
```
```typescript
type CreateProofRequestParams = {
  id?: number;
  circuitId:
    | 'credentialAtomicQueryMTPV2'
    | 'credentialAtomicQueryMTPV2OnChain'
    | 'credentialAtomicQuerySigV2'
    | 'credentialAtomicQuerySigV2OnChain';
  slotIndex?: number;
  challenge?: string; // bigint string
  query: ProofQuery;
};

type ProofQuery = {
  allowedIssuers?: string[];
  credentialSubject?: { [key: string]: any };
  schema?: string;
  claimId?: string;
  credentialSubjectId?: string;
  context?: string;
  type?: string;
};
```

Returns ZKProof
```typescript
type ZKProof = {
  proof: ProofData;
  pub_signals: string[];
};
type ProofData = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
};

```


### Create a backup
To create a backup of keys and credentials:
```typescript
createBackup(): Promise<boolean>
```
Returns true if backup created

### Recovery from a backup
Recovering the identity and credentials from a backup:
```typescript
recoverBackup(): Promise<boolean>
```
Returns true if backup recovered

### Check state contract sync

```typescript
checkStateContractSync({params: }): Promise<boolean>
```

```typescript
type CheckStateContractSyncRequestParams = {
  stateContractAddress: string;
};
```

Returns true if the lightweight state contract on current chain doesn't need to be synced with the state contract on Rarimo chain.

## Snap connector usage examples

### Create a proof
```javascript
const connector = await snap.getConnector();

const proof = connector.createProof({
  circuitId: 'credentialAtomicQuerySigV2OnChain',
  challenge: '1251760352881625298994789945427452069454957821390', // BigInt string
  slotIndex: 0,
  query: {
    allowedIssuers: ['*'],
    context:
    'https://raw.githubusercontent.com/omegatymbjiep/schemas/main/json-ld/NaturalPerson.json-ld',
    credentialSubject: {
      isNatural: {
        $eq: 1,
      },
    },
    type: 'NaturalPerson',
  },
});
```
where:
- **circuitId**: type of proof
- **challenge**(optional): text that will be signed
- **slotIndex**(optional): value in this path in merklized json-ld document
- **query**
	- **allowedIssuers**: types of issuers allowed
		- **\***: all types of Issuers are allowed
	- **context**: URL for getting the vocabulary for the credential
	- **type**: type of credentials allowed
	- **credentialSubject**: query request to a query circuit


### Save Verifiable Credentials
```javascript
const connector = await snap.getConnector();

const proof = connector.saveCredentials({
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
});
```
where:
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
