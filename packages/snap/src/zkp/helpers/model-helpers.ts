import type { Claim as CoreClaim, Id } from '@iden3/js-iden3-core';
import { Proof } from '@iden3/js-merkletree';

import type { ProofType } from '@/zkp/enums';
import type {
  BJJSignatureProof,
  CredentialStatus,
  State,
  TreeState,
} from '@/zkp/types';

export class IssuerData {
  id!: string;

  state!: State;

  authCoreClaim?: string;

  mtp?: Proof;

  credentialStatus?: CredentialStatus;

  updateUrl!: string;
}

export class Iden3SparseMerkleTreeProof {
  type!: ProofType;

  issuerData!: IssuerData;

  mtp!: Proof;

  coreClaim!: string;

  id!: string;
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
