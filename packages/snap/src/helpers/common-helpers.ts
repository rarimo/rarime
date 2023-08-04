import { SUPPORTED_CHAINS } from '../config';

export const getChainInfo = (
  chainId: number,
): {
  rpcUrl: string;
  stateContractAddress: string;
  verifierContractAddress: string;
} => {
  const chainInfo = SUPPORTED_CHAINS[chainId];
  if (!chainInfo) {
    throw new Error(`ChainId ${chainId} not supported`);
  }

  return chainInfo;
};
