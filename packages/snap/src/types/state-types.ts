export type MerkleProof = {
  proof: string[];
};

export type StateInfo = {
  index: string;
  hash: string;
  createdAtTimestamp: string;
  lastUpdateOperationIndex: string;
};

export type GetStateInfoResponse = {
  state: StateInfo;
};

export type OperationProof = {
  path: string[];
  signature: string;
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

export type OperationResponse = {
  operation: Operation;
};
