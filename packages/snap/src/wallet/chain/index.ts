import { ChainInfo, CHAINS } from '@rarimo/rarime-connector';
import { ALLOWEDCOINTYPES } from '../constants';
import db from '../db';

export const getAllChains = async () => {
  const storedChains: Record<string, ChainInfo> = ((await db.get(
    db.CHAINS,
  )) as unknown) as Record<string, ChainInfo>;
  return { ...CHAINS, ...storedChains };
};

export const validateChain = (chainInfo: ChainInfo) => {
  const { chainId, chainName, bip44, bech32Config } = chainInfo;

  if (!chainId) {
    throw new Error('Manadatory param chainId');
  }

  if (!chainName) {
    throw new Error('Manadatory param chainName');
  }

  if (!bech32Config) {
    throw new Error('Manadatory param bech32Config');
  }

  if (!bech32Config.bech32PrefixAccAddr) {
    throw new Error('Manadatory param bech32Config.bech32PrefixAccAddr');
  }

  if (!bip44) {
    throw new Error('Manadatory param bip44 coinType');
  }

  if (bip44.coinType && typeof bip44.coinType !== 'number') {
    throw new Error('bip44.coinType should be of type Number');
  }

  if (bip44.coinType === 60) {
    throw new Error('60 bip44.coinType is not Supported');
  }

  if (!ALLOWEDCOINTYPES.includes(bip44.coinType)) {
    throw new Error('Invalid bip44.coinType value');
  }
};

export const validateChainId = async (chainId: string) => {
  const chains: any = await getAllChains();
  if (!chains[chainId]) {
    throw new Error('Invalid chainId');
  }
};

export const addChain = async (chainInfo: ChainInfo) => {
  return await db.update(db.CHAINS, chainInfo.chainId, chainInfo);
};

export const getChainDetails = async (chainId: string) => {
  const supportedChains: any = await getAllChains();
  if (!supportedChains[chainId]) {
    throw new Error('Invalid chainId');
  }
  return {
    addressPrefix: supportedChains[chainId]?.bech32Config?.bech32PrefixAccAddr,
    coinType: supportedChains[chainId]?.bip44?.coinType,
  };
};
