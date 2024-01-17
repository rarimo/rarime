import { MetamaskSnap } from './snap';
import { checkSnapSupport, isMetamaskInstalled } from './utils';
import versionJson from './version.json';

export { MetamaskSnap } from './snap';
export * from './types';
export { isMetamaskInstalled, isSnapInstalled } from './utils';

export const defaultSnapOrigin = 'npm:@rarimo/rarime';

export const enableSnap = async (
  snapOrigin?: string,
  version = versionJson.version,
): Promise<MetamaskSnap> => {
  const snapId = snapOrigin ?? defaultSnapOrigin;

  if (!(await isMetamaskInstalled())) {
    throw new Error('Metamask is not installed');
  }

  if (!(await checkSnapSupport())) {
    throw new Error('Current version of MetaMask is not supported');
  }

  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: { ...(version && { version }) },
    },
  });

  return new MetamaskSnap(snapId);
};
