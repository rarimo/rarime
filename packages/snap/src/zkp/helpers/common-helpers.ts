import { providers } from 'ethers';
import { config, HOSTNAMES_WHITELIST, SUPPORTED_CHAINS } from '@/config';
import { ChainInfo } from '@/types';

export const getChainInfo = (chainId: number): ChainInfo => {
  const chainInfo = SUPPORTED_CHAINS[chainId];
  if (!chainInfo) {
    throw new Error(`ChainId ${chainId} not supported`);
  }

  return chainInfo;
};

export const getProviderChainInfo = async (): Promise<ChainInfo> => {
  const provider = new providers.Web3Provider(
    (ethereum as any) as providers.ExternalProvider,
  );
  const network = await provider.getNetwork();

  return getChainInfo(network.chainId);
};

export const getRarimoEvmRpcUrl = (chainId: number) => {
  return config.RARIMO_EVM_RPC_URL[SUPPORTED_CHAINS[chainId].rarimoNetworkType];
};

export const getRarimoCoreUrl = (chainId: number) => {
  return config.RARIMO_CORE_URL[SUPPORTED_CHAINS[chainId].rarimoNetworkType];
};

export const getRarimoStateContractAddress = (chainId: number) => {
  return config.RARIMO_STATE_CONTRACT_ADDRESS[
    SUPPORTED_CHAINS[chainId].rarimoNetworkType
  ];
};

export const getHostname = (origin: string): string => {
  return new URL(origin).hostname;
};

export const isOriginInWhitelist = (origin: string) => {
  return HOSTNAMES_WHITELIST.includes(getHostname(origin));
};

export const uniqBy = (arr: any[], predicate: string) => {
  return [
    ...arr
      .reduce((map, item) => {
        const key =
          item === null || item === undefined ? item : item[predicate];

        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
};
