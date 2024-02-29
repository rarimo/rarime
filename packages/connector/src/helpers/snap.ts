import { compare } from 'compare-versions';
import { SUPPORTED_METAMASK_VERSION } from '../consts';
import { GetSnapsResponse } from '../types';
import { RPCMethods } from '../enums';

export const getProvider = async () => {
  let mmFound = false;
  if ('detected' in window.ethereum) {
    for (const provider of window.ethereum.detected) {
      try {
        // Detect snaps support
        await provider.request({
          method: 'wallet_getSnaps',
        });
        // enforces MetaMask as provider
        window.ethereum.setProvider(provider);

        mmFound = true;
        return provider;
      } catch {
        // no-op
      }
    }
  }

  if (!mmFound && 'providers' in window.ethereum) {
    for (const provider of window.ethereum.providers) {
      try {
        // Detect snaps support
        await provider.request({
          method: 'wallet_getSnaps',
        });

        window.ethereum = provider;

        mmFound = true;
        return provider;
      } catch {
        // no-op
      }
    }
  }

  return window.ethereum;
};

export const isMetamaskInstalled = async (): Promise<boolean> => {
  try {
    const provider = await getProvider();
    return Boolean(provider?.isMetaMask);
  } catch {
    return false;
  }
};

export const checkSnapSupport = async () => {
  const version = await window?.ethereum?.request?.({
    method: 'web3_clientVersion',
  });

  const currentVersion = version.match(/\/v?(\d+\.\d+\.\d+)/u)?.[1] ?? null;
  const isMobile = version.endsWith('Mobile');
  return compare(currentVersion, SUPPORTED_METAMASK_VERSION, '>=') && !isMobile;
};

export const getWalletSnaps = async (): Promise<GetSnapsResponse> => {
  const provider = await getProvider();

  return await provider.request({
    method: 'wallet_getSnaps',
  });
};

export const sendSnapMethod = async <T>(
  request: { method: RPCMethods; params?: any[] },
  snapId: string,
): Promise<T> => {
  const provider = await getProvider();

  return await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      request,
      snapId,
    },
  });
};
