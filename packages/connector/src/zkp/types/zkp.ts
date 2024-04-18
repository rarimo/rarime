import type { TransactionRequest } from '@ethersproject/providers';

import type { CircuitId } from '@/zkp/enums';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: any;
  }
}

export type ChainZkpInfo = {
  targetChainId: number;
  targetRpcUrl: string;
  targetStateContractAddress: string;

  rarimoApiUrl: string;
  rarimoEvmRpcApiUrl: string;
  rarimoStateContractAddress: string;
};

export type SaveCredentialsResponse = Pick<W3CCredential, 'type'> &
  Pick<W3CCredential, 'issuer'>;

export type IdentityDidPair = {
  identityIdString: string;
  identityIdBigIntString: string;
};

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
  proof?: { [key: string]: any } | any[];
};

export type ProofQuery = {
  allowedIssuers?: string[];
  credentialSubject?: { [key: string]: any };
  schema?: string;
  claimId?: string;
  credentialSubjectId?: string;
  context?: string;
  type?: string[];
};

export type ZKProof = {
  proof: ProofData;
  pub_signals: string[];
};

export type ProofData = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
};

export type StateInfo = {
  index: string;
  hash: string;
  createdAtTimestamp: string;
  createdAtBlock: string;
  lastUpdateOperationIndex: string;
};

export type UpdateStateDetails = {
  stateRootHash: string;
  gistRootDataStruct: {
    root: string | number;
    createdAtTimestamp: string | number;
  };
  proof: string;
};

export type ZKPProofResponse = {
  updateStateDetails: UpdateStateDetails;
  updateStateTx?: TransactionRequest;
  zkpProof: ZKProof;
  statesMerkleData?: {
    issuerId: string;
    state: StateInfo;
    merkleProof: string[];
  };
};

export enum OperationStatus {
  Signed = 'SIGNED',
  Initialized = 'INITIALIZED',
  Approved = 'APPROVED',
  NotApproved = 'NOT_APPROVED',
}

export type Operation = {
  index: string;
  operationType: string;
  details: {
    '@type': string;
    contract: string;
    chain: string;
    GISTHash: string;
    stateRootHash: string;
    timestamp: string;
  };
  status: OperationStatus;
  creator: string;
  timestamp: string;
};

export type OperationProof = {
  path: string[];
  signature: string;
};

export type ZKPProofSnapResponse = {
  chainInfo: ChainZkpInfo;
  rarimoCoreUrl: string;
  isSynced: boolean;

  issuerHexId: string;

  stateData: StateInfo;
  merkleProof: {
    proof: string[];
  };
  operation: Operation;

  zkpProof: ZKProof;
};

export type CreateProofRequest = {
  id?: number;
  accountAddress?: string;
  circuitId: CircuitId;
  challenge?: string; // bigint string
  query: ProofQuery;
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

export type MerkleProof = {
  proof: string[];
};

export type GetStateInfoResponse = {
  state: StateInfo;
};

export type OperationResponse = {
  operation: Operation;
};
