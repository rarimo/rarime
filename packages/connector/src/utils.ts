import { GetSnapsResponse } from './types';
import { METAMASK_SNAPS_MAJOR_VERSION } from './consts';
import { defaultSnapOrigin } from '.';

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

export const getWalletSnaps = async (): Promise<GetSnapsResponse> => {
  return await window.ethereum.request({
    method: 'wallet_getSnaps',
  });
};

export const isMetamaskInstalled = async (): Promise<boolean> => {
  try {
    const provider = await getProvider();
    return Boolean(provider?.isMetaMask);
  } catch {
    return false;
  }
};

export const isSnapInstalled = async (
  snapOrigin?: string,
  version?: string,
): Promise<boolean> => {
  try {
    await getProvider();
    const snapId = snapOrigin ?? defaultSnapOrigin;
    return Boolean(
      Object.values(await getWalletSnaps()).find(
        (permission) =>
          permission.id === snapId &&
          (!version || permission.version === version),
      ),
    );
  } catch (e) {
    console.log('Failed to obtain installed snaps', e);
    return false;
  }
};

export const checkSnapSupport = async () => {
  const version = await window?.ethereum?.request?.({
    method: 'web3_clientVersion',
  });

  const majorVersion = Number(version.match(/.+v([0-9]+).+/u)?.[1] ?? 0);
  const isMobile = version.endsWith('Mobile');
  return majorVersion >= METAMASK_SNAPS_MAJOR_VERSION && !isMobile;
};
