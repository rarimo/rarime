import { ProofQuery } from './zkp';

export type CreateIdentityRequestParams = {
  privateKeyHex?: string;
};

export type CheckCredentialExistenceRequestParams = {
  claimOffer?: SaveCredentialsRequestParams;
  proofRequest?: CreateProofRequestParams;
};

export type SaveCredentialsRequestParams = {
  body: {
    Credentials: [
      {
        description: string;
        id: string;
      },
    ];
    url: string;
  };
  from: string;
  id: string;
  threadID?: string;
  to: string;
  typ?: string;
  type: string;
};

export type RemoveCredentialsRequestParams = {
  ids: string[];
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
