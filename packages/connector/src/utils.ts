import { GetSnapsResponse } from './types';
import { defaultSnapOrigin } from '.';

export const isMetamaskInstalled = (): boolean => {
  if (!window.ethereum) {
    return false;
  }
  return window.ethereum.isMetaMask;
};

export const getWalletSnaps = async (): Promise<GetSnapsResponse> => {
  return await window.ethereum.request({
    method: 'wallet_getSnaps',
  });
};

export const isMetamaskFlask = async (): Promise<boolean> => {
  const mmVersion = await window.ethereum.request({
    method: 'web3_clientVersion',
  });
  return (mmVersion as string).includes('flask');
};

export const isSnapInstalled = async (
  snapOrigin?: string,
  version?: string,
): Promise<boolean> => {
  try {
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
