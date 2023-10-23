import { TransactionRequest } from '@ethersproject/providers';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: any;
  }
}

export enum RPCMethods {
  CreateIdentity = 'create_identity',
  CreateBackup = 'create_backup',
  RecoverBackup = 'recover_backup',
  SaveCredentials = 'save_credentials',
  CreateProof = 'create_proof',
  CheckStateContractSync = 'check_state_contract_sync',
  GetCredentials = 'get_credentials',
}

export type SnapConnector = {
  createIdentity(): Promise<string>;
  createBackup(): Promise<boolean>;
  recoverBackup(): Promise<boolean>;
  saveCredentials(
    params: SaveCredentialsRequestParams,
  ): Promise<W3CCredential[]>;
  createProof(params: CreateProofRequestParams): Promise<ZKPProofResponse>;
  checkStateContractSync(): Promise<boolean>;
  getCredentials(): Promise<W3CCredential[]>;
};

export type GetSnapsResponse = {
  [k: string]: {
    permissionName?: string;
    id?: string;
    version?: string;
    initialPermissions?: { [k: string]: unknown };
  };
};

export type SaveCredentialsRequestParams = {
  body: {
    credentials: [
      {
        description: string;
        id: string;
      },
    ];
    url: string;
  };
  from: string;
  id: string;
  thid?: string;
  to: string;
  typ?: string;
  type: string;
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
  type?: string;
};

export type CreateProofRequestParams = {
  id?: number;
  accountAddress?: string; // Metamask user address for onchain proofs
  issuerDid: string;
  circuitId:
    | 'credentialAtomicQueryMTPV2'
    | 'credentialAtomicQueryMTPV2OnChain'
    | 'credentialAtomicQuerySigV2'
    | 'credentialAtomicQuerySigV2OnChain';
  challenge?: string; // bigint string
  query: ProofQuery;
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

export type RarimoNetworkType = 'mainnet' | 'beta';

export type ChainInfo = {
  id: number;
  rpcUrl: string;
  stateContractAddress: string;
  rarimoNetworkType: RarimoNetworkType;
};

export type OperationProof = {
  path: string[];
  signature: string;
};

export type ZKPProofSnapResponse = {
  chainInfo: ChainInfo;
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
