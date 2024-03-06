import { getChainInfo } from '@rarimo/zkp-iden3';
import { providers } from 'ethers';

import { HOSTNAMES_WHITELIST } from '@/config';
import type { ChainInfo } from '@/types';

export const getProviderChainInfo = async (): Promise<ChainInfo> => {
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
