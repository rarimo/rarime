import { MetamaskSnap } from './snap';
import { isMetamaskInstalled, isSnapInstalled } from './utils';

export { MetamaskSnap } from './snap';
export * from './types';
export { isMetamaskInstalled, isSnapInstalled } from './utils';

export const defaultSnapOrigin = 'npm:@rarimo/rarime';

export const enableSnap = async (
  snapOrigin?: string,
  version?: string,
): Promise<MetamaskSnap> => {
  const snapId = snapOrigin ?? defaultSnapOrigin;

  if (!(await isMetamaskInstalled())) {
    throw new Error('Metamask is not installed');
  }

  const isInstalled = await isSnapInstalled(snapId, version);

  if (!isInstalled) {
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: { ...(version && { version }) },
      },
    });
  }

  return new MetamaskSnap(snapId);
};
