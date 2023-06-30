
export interface CredentialStatus {
  id: string;
  type: string;
  revocationNonce?: number;
  statusIssuer?: CredentialStatus;
}

export interface CredentialSchema {
  id: string;
  type: string;
}

export interface W3CCredential{
  id: string;
  '@context': string[];
  type: string[];
  expirationDate?: string;
  issuanceDate?: string;
  credentialSubject: { [key: string]: object | string | number };
  credentialStatus: CredentialStatus;
  issuer: string;
  credentialSchema: CredentialSchema;
  proof?: object;
}
