declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: {
      isMetaMask: boolean;
      isUnlocked: Promise<boolean>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: <T>(request: { method: string; params?: any }) => Promise<T>;
      on: (eventName: unknown, callback: unknown) => unknown;
    };
  }
}

export enum RPCMethods {
  CreateIdentity = 'create_identity',
  CreateBackup = 'create_backup',
  RecoverBackup = 'recover_backup',
  SaveCredentials = 'save_credentials',
  CreateProof = 'create_proof',
  CheckStateContractSync = 'check_state_contract_sync',
}

export type SnapConnector = {
  createIdentity(): Promise<string>;
  createBackup(): Promise<boolean>;
  recoverBackup(): Promise<boolean>;
  saveCredentials(
    params: SaveCredentialsRequestParams,
  ): Promise<W3CCredential[]>;
  createProof(params: CreateProofRequestParams): Promise<ZKProof>;
  checkStateContractSync(params: CheckStateContractSyncRequestParams): Promise<boolean>;
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
  circuitId:
    | 'credentialAtomicQueryMTPV2'
    | 'credentialAtomicQueryMTPV2OnChain'
    | 'credentialAtomicQuerySigV2'
    | 'credentialAtomicQuerySigV2OnChain';
  slotIndex?: number;
  challenge?: string; // bigint string
  query: ProofQuery;
};

export type CheckStateContractSyncRequestParams = {
  stateContractAddress: string;
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
