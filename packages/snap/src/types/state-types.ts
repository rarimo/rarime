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
