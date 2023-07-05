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
  proof?: any[];
};

export type ClaimOffer = {
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
  thid: string;
  to: string;
  typ: string;
  type: string;
};
