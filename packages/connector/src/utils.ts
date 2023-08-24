import { GetSnapsResponse } from './types';
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
