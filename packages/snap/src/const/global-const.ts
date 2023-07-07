export const defaultMTLevels = 40; // max MT levels, default value for identity circuits
export const defaultValueArraySize = 64; // max value array size, default value for identity circuits
export const defaultMTLevelsOnChain = 64; // max MT levels on chain, default value for identity circuits
export const defaultMTLevelsClaimsMerklization = 32; // max MT levels of JSON-LD merklization on claim

export enum Operators {
  NOOP = 0, // No operation, skip query verification in circuit
  EQ = 1,
  LT = 2,
  GT = 3,
  IN = 4,
  NIN = 5,
  NE = 6,
}

export const QueryOperators = {
  $noop: Operators.NOOP,
  $eq: Operators.EQ,
  $lt: Operators.LT,
  $gt: Operators.GT,
  $in: Operators.IN,
  $nin: Operators.NIN,
  $ne: Operators.NE,
};
