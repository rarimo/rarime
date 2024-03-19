import type { Signature } from '@iden3/js-crypto';
import type { Claim } from '@iden3/js-iden3-core';
import type { Hash, Proof } from '@iden3/js-merkletree';
import type { ProofQuery } from '@rarimo/rarime-connector';

import type { CircuitId } from '../enums';
import type { Query } from '../helpers';

export type CreateProofRequest = {
  id?: number;
  accountAddress?: string;
  circuitId: CircuitId;
  challenge?: string; // bigint string
  query: ProofQuery;
};

export type CreateProofRequestParams = {
  issuerDid: string;
} & CreateProofRequest;

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
