import { SUPPORTED_CHAINS } from '../config';
import { ChainInfo } from '../types';

export const getChainInfo = (chainId: number): ChainInfo => {
  const chainInfo = SUPPORTED_CHAINS[chainId];
  if (!chainInfo) {
    throw new Error(`ChainId ${chainId} not supported`);
  }

  return chainInfo;
};
