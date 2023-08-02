/* eslint-disable jsdoc/check-tag-names */
import { Proof } from '@iden3/js-merkletree';

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

export type ClaimOffer = {
  body: {
    credentials: [
      {
        description: string;
        id: string;
      },
    ];
    /**
     *
     * @format
     * url
     */
    url: string;
  };
  from: string;
  id: string;
  thid?: string;
  to: string;
  typ?: string;
  type: string;
};

export type Issuer = {
  state?: string;
  rootOfRoots?: string;
  claimsTreeRoot?: string;
  revocationTreeRoot?: string;
};

export type RevocationStatus = {
  mtp: Proof;
  issuer: Issuer;
};
