import { providers } from 'ethers';

import versionJson from '../version.json';

import { CORE_CHAINS, defaultSnapOrigin, TARGET_CHAINS } from '@/consts';
import type { RPCMethods } from '@/enums';
import {
  checkSnapSupport,
  getProvider,
  getWalletSnaps,
  isMetamaskInstalled,
} from '@/helpers';
import type {
  ChainInfo,
  ChainZkpInfo,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@/types';

export class RarimeSnapBase {
  public readonly snapId: string;

  public readonly version: string;

  public supportedCoreChains: Record<string, ChainInfo> = CORE_CHAINS;

  public supportedTargetZkpChains: Record<number, ChainZkpInfo> = TARGET_CHAINS;

  public constructor(
    snapId = defaultSnapOrigin,
    version = versionJson.version,

    supportedCoreChains = CORE_CHAINS,
    supportedTargetZkpChains = TARGET_CHAINS,
  ) {
    this.snapId = snapId;
    this.version = version;
    this.supportedCoreChains = supportedCoreChains;
    this.supportedTargetZkpChains = supportedTargetZkpChains;
  }

  public async sendSnapRequest<Method extends RPCMethods>(
    method: Method,
    params?: SnapRequestParams[Method],
  ): Promise<SnapRequestsResponses[Method]> {
    const provider = await getProvider();

    return await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        request: {
          method,
          params,
        },
        snapId: this.snapId,
      },
    });
  }

  public async enable() {
    const snapId = this.snapId ?? defaultSnapOrigin;

    if (!(await isMetamaskInstalled())) {
      throw new Error('Metamask is not installed');
    }

    if (!(await checkSnapSupport())) {
      throw new Error('Current version of MetaMask is not supported');
    }

    const provider = await getProvider();

    return await provider.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: { ...(this.version && { version: this.version }) },
      },
    });
  }

  async isInstalled() {
    try {
      await getProvider();

      const walletSnaps = await getWalletSnaps();

      return Boolean(
        Object.values(walletSnaps).find(
          (permission) =>
            permission.id === this.snapId &&
            (!this.version || permission.version === this.version),
        ),
      );
    } catch (error) {
      console.log('Failed to obtain installed snaps', error);
      return false;
    }
  }

  _getChainInfo = async (
    chainId?: number,
  ): Promise<{
    coreChain: ChainInfo;
    targetChain: ChainZkpInfo;
  }> => {
    let targetChainId = chainId;

    if (!targetChainId) {
      const rawProvider = await getProvider();

      const provider = new providers.Web3Provider(rawProvider);

      const network = await provider.getNetwork();

      targetChainId = network.chainId;
    }

    if (!targetChainId) {
      throw new Error('ChainId not provided');
    }

    const targetChain = this.supportedTargetZkpChains[targetChainId];
    const coreChain = this.supportedCoreChains[targetChain.coreChainId];

    return {
      coreChain,
      targetChain,
    };
  };
}
