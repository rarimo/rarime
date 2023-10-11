import { MetamaskSnap } from './snap';
import { isMetamaskInstalled } from './utils';

export { MetamaskSnap } from './snap';
export * from './types';
export { isMetamaskInstalled, isSnapInstalled } from './utils';

export const defaultSnapOrigin = 'npm:@electr1xxxx/snapp';
export const enableSnap = async (
  snapOrigin?: string,
  version = '0.8.x',
): Promise<MetamaskSnap> => {
  const snapId = snapOrigin ?? defaultSnapOrigin;

  if (!(await isMetamaskInstalled())) {
    throw new Error('Metamask is not installed');
  }

  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: { ...(version && { version }) },
    },
  });

  return new MetamaskSnap(snapId);
};
