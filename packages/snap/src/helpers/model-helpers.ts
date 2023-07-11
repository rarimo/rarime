import { Proof } from '@iden3/js-merkletree';
import { Claim as CoreClaim, Id } from '@iden3/js-iden3-core';
import { ProofType } from '../enums';
import {
  BJJSignatureProof,
  CredentialStatus,
  State,
  TreeState,
} from '../types';

export class IssuerData {
  id!: string;

  state!: State;

  authCoreClaim?: string;

  mtp?: Proof;

  credentialStatus?: CredentialStatus;
}

export class Iden3SparseMerkleTreeProof {
  type!: ProofType;

  issuerData!: IssuerData;

  mtp!: Proof;

  coreClaim!: string;
}

export class BJJSignatureProof2021 {
  type!: ProofType;

  issuerData!: IssuerData;

  signature!: string;

  coreClaim!: string;
}

export class CircuitClaim {
  issuerId!: Id;

  claim!: CoreClaim;

  signatureProof!: BJJSignatureProof;

  incProof!: {
    proof: Proof;
    treeState: TreeState;
  };
}

export class ValueProof {
  path: bigint;

  value?: bigint;

  mtp: Proof;

  constructor() {
    this.path = BigInt(0);
    this.value = BigInt(0);
    this.mtp = new Proof();
  }
}

export class Query {
  slotIndex!: number;

  values!: bigint[];

  operator!: number;

  valueProof?: ValueProof;
}
