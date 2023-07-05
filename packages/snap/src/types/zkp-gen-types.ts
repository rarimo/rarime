import type { Hash, Siblings } from '@iden3/js-merkletree';

export type IssuerState = {
  claimsTreeRoot: Hash;
  revocationTreeRoot: Hash;
  rootOfRoots: Hash;
  state: Hash;
};

export type ClaimStatus = {
  issuer: IssuerState;
  mtp: {
    existence: boolean;
    siblings: Siblings;
    nodeAux?: {
      key: Hash;
      value: Hash;
    };
  };
};

export type Schema = {
  $metadata: {
    uris: {
      jsonLdContext: string;
      jsonSchema: string;
    };
  };
};
