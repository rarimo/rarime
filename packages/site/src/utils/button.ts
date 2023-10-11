// eslint-disable-next-line import/no-extraneous-dependencies
import { MetamaskSnap } from '@electr1xxxx/snapp-connector';
import { isLocalSnap } from './snap';

export const shouldDisplayReconnectButton = (installedSnap?: MetamaskSnap) =>
  installedSnap && isLocalSnap(installedSnap?.snapId);
