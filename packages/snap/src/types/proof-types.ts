export type ProofQuery = {
  allowedIssuers?: string[];
  credentialSubject?: { [key: string]: unknown };
  schema?: string; // string url
  claimId?: string;
  credentialSubjectId?: string;
  context?: string;
  type?: string;
};

export type CreateProofRequest = {
  id?: number;
  circuitId?: string;
  optional?: boolean;
  query: ProofQuery;
};
