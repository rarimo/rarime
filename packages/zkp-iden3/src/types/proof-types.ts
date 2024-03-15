import type { Signature } from '@iden3/js-crypto';
import type { Claim, Id } from '@iden3/js-iden3-core';
import type { Proof, Hash } from '@iden3/js-merkletree';

import type { ProofType } from '@/enums';

export type CredentialStatus = {
  id: string;
  type: string;
  revocationNonce?: number;
  statusIssuer?: CredentialStatus;
};

export type BJJSignatureProofRaw = {
  type: ProofType.BJJSignature;
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
};

export type Iden3SparseMerkleTreeProofRaw = {
  id: string;
  type: ProofType.Iden3SparseMerkleTreeProof;
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
  credentialSchema: {
    id: string;
    type: string;
  };
  proof?: [BJJSignatureProofRaw, Iden3SparseMerkleTreeProofRaw];
};

export type RevocationStatus = {
  mtp: Proof;
  issuer: {
    state: string;
    rootOfRoots: string;
    claimsTreeRoot: string;
    revocationTreeRoot: string;
  };
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

// FIXME: used for nonRevProof, but names not appropriate
export type ClaimNonRevStatus = {
  treeState: TreeState;
  proof: Proof;
};

export type QueryWithFieldName = {
  query: Query;
  fieldName: string;
  isSelectiveDisclosure?: boolean;
};

export type JSONSchema = {
  $metadata: {
    uris: { [key: string]: string };
    serialization?: {
      indexDataSlotA: string;
      indexDataSlotB: string;
      valueDataSlotA: string;
      valueDataSlotB: string;
    };
  };
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

export type CircuitClaim = {
  issuerId: Id;
  claim: Claim;
  signatureProof?: {
    signature: Signature;
    issuerAuthClaim?: Claim;
    issuerAuthIncProof: {
      proof: Proof;
      treeState?: TreeState;
    };
    issuerAuthNonRevProof: {
      proof: Proof;
      treeState?: TreeState;
    };
  };
  incProof?: {
    proof: Proof;
    treeState: TreeState;
  };
};

export type Query = {
  slotIndex: number;
  values: bigint[];
  operator: number;
  valueProof?: {
    path: bigint;
    value?: bigint;
    mtp: Proof;
  };
};
