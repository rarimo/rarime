export enum CircuitId {
  // AtomicQueryMTPV2 is a type for credentialAtomicQueryMTPV2.circom
  AtomicQueryMTPV2 = 'credentialAtomicQueryMTPV2',
  // AtomicQueryMTPV2OnChain is a type for credentialAtomicQueryMTPV2OnChain.circom
  AtomicQueryMTPV2OnChain = 'credentialAtomicQueryMTPV2OnChain',
  // AtomicQuerySig is a type for credentialAttrQuerySig.circom
  AtomicQuerySigV2 = 'credentialAtomicQuerySigV2',
  // AtomicQuerySigOnChain is a type for credentialAtomicQuerySigOnChain.circom
  AtomicQuerySigV2OnChain = 'credentialAtomicQuerySigV2OnChain',
}

export enum ProofType {
  BJJSignature = 'BJJSignature2021',
  Iden3SparseMerkleTreeProof = 'Iden3SparseMerkleTreeProof',
}

export enum Operators {
  NOOP = 0, // No operation, skip query verification in circuit
  EQ = 1,
  LT = 2,
  GT = 3,
  IN = 4,
  NIN = 5,
  NE = 6,
}
