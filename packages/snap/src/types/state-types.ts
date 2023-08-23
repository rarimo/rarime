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

export type IdentityNode = {
  node: {
    key: string;
    priority: string;
    left: string;
    right: string;
    hash: string;
    childrenHash: string;
  };
};

export type IdentityParams = {
  params: {
    lcgA: string;
    lcgB: string;
    lcgMod: string;
    lcgValue: string;
    identityContractAddress: string;
    chainName: string;
    GISTHash: string;
    GISTUpdatedTimestamp: string;
    treapRootKey: string;
    statesWaitingForSign: [string];
  };
};
