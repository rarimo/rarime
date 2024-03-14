import type { Signature } from '@iden3/js-crypto';
import type { Claim } from '@iden3/js-iden3-core';
import type { Hash, Proof } from '@iden3/js-merkletree';

import type { Query } from '@/helpers';

export type CredentialStatus = {
  id: string;
  type: string;
  revocationNonce?: number;
  statusIssuer?: CredentialStatus;
};

export type CredentialSchema = {
  id: string;
  type: string;
};

export type W3CCredential = {
  id: string;
  '@context': string[];
  type: string[];
  expirationDate?: string;
  issuanceDate?: string;
  credentialSubject: { [key: string]: object | string | number };
  credentialStatus: CredentialStatus;
  issuer: string;
  credentialSchema: CredentialSchema;
  proof?: [
    {
      type: 'BJJSignature2021';
      issuerData: {
        id: string;
        updateUrl: string;
        state: {
          claimsTreeRoot: string;
          value: string;
        };
        authCoreClaim: string;
        mtp: {
          existence: boolean;
          siblings: string[];
        };
        credentialStatus: {
          id: string;
          revocationNonce: number;
          type: string;
        };
      };
      coreClaim: string;
      signature: string;
    },
    {
      id: string;
      type: 'Iden3SparseMerkleTreeProof';
      issuerData: {
        id: string;
        updateUrl: string;
        state: {
          txId: string;
          blockTimestamp: number;
          blockNumber: number;
          rootOfRoots: string;
          claimsTreeRoot: string;
          revocationTreeRoot: string;
          value: string;
        };
      };
      coreClaim: string;
      mtp: {
        existence: boolean;
        siblings: string[];
      };
    },
  ];
};

export type Issuer = {
  state?: string;
  rootOfRoots?: string;
  claimsTreeRoot?: string;
  revocationTreeRoot?: string;
};

export type RevocationStatus = {
  mtp: Proof;
  issuer: Issuer;
};

export type State = {
  txId?: string;
  blockTimestamp?: number;
  blockNumber?: number;
  rootOfRoots: string;
  claimsTreeRoot: string;
  revocationTreeRoot: string;
  value: string;
  status?: string;
};

export type TreeState = {
  state: Hash;
  claimsRoot: Hash;
  revocationRoot: Hash;
  rootOfRoots: Hash;
};

export type ClaimNonRevStatus = {
  treeState: TreeState;
  proof: Proof;
};

export type MTProof = {
  proof: Proof;
  treeState?: TreeState;
};

export type BJJSignatureProof = {
  signature: Signature;
  issuerAuthClaim?: Claim;
  issuerAuthIncProof: MTProof;
  issuerAuthNonRevProof: MTProof;
};

export type QueryWithFieldName = {
  query: Query;
  fieldName: string;
  isSelectiveDisclosure?: boolean;
};

export type SerializationSchema = {
  indexDataSlotA: string;
  indexDataSlotB: string;
  valueDataSlotA: string;
  valueDataSlotB: string;
};

export type SchemaMetadata = {
  uris: { [key: string]: string };
  serialization?: SerializationSchema;
};

export type JSONSchema = {
  $metadata: SchemaMetadata;
  $schema: string;
  type: string;
};

export type NodeAuxValue = {
  key: Hash;
  value: Hash;
  noAux: string;
};

export type StateProof = {
  root: bigint;
  existence: boolean;
  siblings: bigint[];
  index: bigint;
  value: bigint;
  auxExistence: boolean;
  auxIndex: bigint;
  auxValue: bigint;
};

export type GISTProof = {
  root: Hash;
  proof: Proof;
};
