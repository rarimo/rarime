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
