import type { ChainInfo, ChainZkpInfo } from '@rarimo/rarime-connector';
import { TARGET_CHAINS, RARIMO_CHAINS } from '@rarimo/rarime-connector';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import { ALLOWED_COIN_TYPES } from '@/wallet/constants';

export class RarimoChainsManager {
  rarimoChains: Record<string, ChainInfo>;

  constructor(rarimoChains: Record<string, ChainInfo>) {
    this.rarimoChains = rarimoChains;
  }

  public static async create() {
    const storedChains = await RarimoChainsManager.getFromStore();

    return new RarimoChainsManager({
      ...storedChains,
      ...RARIMO_CHAINS,
    });
  }

  public static async getFromStore() {
    return snapStorage.getItem(StorageKeys.rarimoChains);
  }

  public static validateChain(chainInfo: ChainInfo) {
    const { chainId, chainName, bip44, bech32Config } = chainInfo;

    if (!chainId) {
      throw new Error('Mandatory param chainId');
    }

    if (!chainName) {
      throw new Error('Mandatory param chainName');
    }

    if (!bech32Config) {
      throw new Error('Mandatory param bech32Config');
    }

    if (!bech32Config.bech32PrefixAccAddr) {
      throw new Error('Mandatory param bech32Config.bech32PrefixAccAddr');
    }

    if (!bip44) {
      throw new Error('Mandatory param bip44 coinType');
    }

    if (bip44.coinType && isNaN(Number(bip44.coinType))) {
      throw new Error('bip44.coinType should be of type Number');
    }

    if (bip44.coinType === 60) {
      throw new Error('60 bip44.coinType is not Supported');
    }

    if (!ALLOWED_COIN_TYPES.includes(bip44.coinType)) {
      throw new Error('Invalid bip44.coinType value');
    }
  }

  public isChainExist(chainId: string) {
    return Boolean(this.rarimoChains[chainId]);
  }

  public async addChain(chainInfo: ChainInfo) {
    if (RARIMO_CHAINS[chainInfo.chainId]) {
      throw new Error('Cannot replace default Rarimo chain');
    }

    const newState = {
      ...this.rarimoChains,
      [chainInfo.chainId]: chainInfo,
    };

    this.rarimoChains = newState;

    return await snapStorage.setItem(StorageKeys.rarimoChains, newState);
  }

  public getChainDetails(chainId: string) {
    const chain = this.rarimoChains[chainId];

    if (!chain) {
      throw new Error('Invalid chainId');
    }

    return chain;
  }
}

export class TargetChainsManager {
  targetChains: Record<string, ChainZkpInfo>;

  constructor(targetChains: Record<string, ChainZkpInfo>) {
    this.targetChains = targetChains;
  }

  public static async create() {
    const storedChains = await TargetChainsManager.getFromStore();

    return new TargetChainsManager({
      ...storedChains,
      ...TARGET_CHAINS,
    });
  }

  public static async getFromStore() {
    return snapStorage.getItem(StorageKeys.targetChains);
  }

  public static async validateChain(chainInfo: ChainZkpInfo) {
    if (!chainInfo.targetChainId) {
      throw new Error('Mandatory param targetChainId');
    }

    if (!chainInfo.targetChainId) {
      throw new Error('Mandatory param targetChainId');
    }

    if (!chainInfo.targetRpcUrl) {
      throw new Error('Mandatory param targetRpcUrl');
    }

    if (!chainInfo.coreChainId) {
      throw new Error('Mandatory param coreChainId');
    }

    const rarimoChainsManager = await RarimoChainsManager.create();

    if (!rarimoChainsManager.isChainExist(chainInfo.coreChainId)) {
      throw new Error('Invalid coreChainId');
    }
  }

  public isChainExist(chainId: string) {
    return Boolean(this.targetChains[chainId]);
  }

  public async addChain(chainInfo: ChainZkpInfo) {
    if (TARGET_CHAINS[chainInfo.targetChainId]) {
      throw new Error('Cannot replace default "target" chain');
    }

    const newState = {
      ...this.targetChains,
      [chainInfo.targetChainId]: chainInfo,
    };

    this.targetChains = newState;

    return await snapStorage.setItem(StorageKeys.rarimoChains, newState);
  }

  public getChainDetails(chainId: string) {
    const chain = this.targetChains[chainId];

    if (!chain) {
      throw new Error('Invalid chainId');
    }

    return chain;
  }
}

export const getRarimoChain = async (rarimoChainId: string) => {
  const rarimoChainsManager = await RarimoChainsManager.create();

  if (!rarimoChainsManager.isChainExist(rarimoChainId)) {
    throw new Error('Invalid rarimoChainId');
  }

  return rarimoChainsManager.getChainDetails(rarimoChainId);
};

export const getTargetChain = async (targetChainId: string) => {
  const targetChainsManager = await TargetChainsManager.create();

  if (!targetChainsManager.isChainExist(targetChainId)) {
    throw new Error('Invalid targetChainId');
  }

  return targetChainsManager.getChainDetails(targetChainId);
};

export const getChains = async (
  rarimoChainId: string,
  targetChainId: string,
) => {
  const [rarimoChain, targetChain] = await Promise.all([
    getRarimoChain(rarimoChainId),
    getTargetChain(targetChainId),
  ]);

  return { rarimoChain, targetChain };
};
