import { providers } from 'ethers';
import { config, SUPPORTED_CHAINS } from '../config';
import { ChainInfo } from '../types';

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

export const getDomain = (origin: string): string => {
  return new URL(origin).hostname.split('.').slice(-2).join('.');
};
