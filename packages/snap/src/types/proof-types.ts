import { Signature } from '@iden3/js-crypto';
import { Claim } from '@iden3/js-iden3-core';
import { Hash, Proof } from '@iden3/js-merkletree';
import { Query } from '../helpers';
import { CircuitId } from '../enums';

export type ProofQuery = {
  allowedIssuers?: string[];
  credentialSubject?: { [key: string]: any };
  schema?: string; // string url
  claimId?: string;
  credentialSubjectId?: string;
  context?: string;
  // should match vc.type
  type?: string[];
};

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
