import type { ChainZkpInfo } from '@rarimo/rarime-connector';
import { providers } from 'ethers';

import { HOSTNAMES_WHITELIST, SUPPORTED_CHAINS } from '@/config';

export const getChainInfo = (chainId: number): ChainZkpInfo => {
  const chainInfo = SUPPORTED_CHAINS[chainId];
  if (!chainInfo) {
    throw new Error(`ChainId ${chainId} not supported`);
  }

  return chainInfo;
};

export const getProviderChainInfo = async (): Promise<ChainZkpInfo> => {
  const provider = new providers.Web3Provider(
    ethereum as any as providers.ExternalProvider,
  );
  const network = await provider.getNetwork();

  return getChainInfo(network.chainId);
};

export const getHostname = (origin: string): string => {
  return new URL(origin).hostname;
};

export const isOriginInWhitelist = (origin: string) => {
  return HOSTNAMES_WHITELIST.includes(getHostname(origin));
};
