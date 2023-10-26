import { MetamaskSnap } from './snap';
import { isMetamaskInstalled } from './utils';
import versionJson from './version.json';

export { MetamaskSnap } from './snap';
export * from './types';
export { isMetamaskInstalled, isSnapInstalled } from './utils';

export const defaultSnapOrigin = 'local:http://localhost:8081';

export const enableSnap = async (
  snapOrigin?: string,
  version = versionJson.version,
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
