import { MetamaskSnap } from './snap';
import { isMetamaskInstalled, isMetamaskFlask, isSnapInstalled } from './utils';

export { MetamaskSnap } from './snap';
export * from './types';
export { isMetamaskInstalled, isMetamaskFlask, isSnapInstalled } from './utils';

export const defaultSnapOrigin = 'local:http://localhost:8081'; // TODO: change

export const enableSnap = async (
  snapOrigin?: string,
  version?: string,
): Promise<MetamaskSnap> => {
  const snapId = snapOrigin ?? defaultSnapOrigin;

  if (!isMetamaskInstalled()) {
    throw new Error('Metamask is not installed');
  }

  if (!(await isMetamaskFlask())) {
    throw new Error(
      'MetaMask is not supported. Please install MetaMask Flask.',
    );
  }

  const isInstalled = await isSnapInstalled(snapId);

  if (!isInstalled) {
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: { ...(version && { version }) },
      },
    });
  }

  return new MetamaskSnap(snapOrigin || defaultSnapOrigin);
};
