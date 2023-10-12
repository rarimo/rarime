// eslint-disable-next-line import/no-extraneous-dependencies
import { MetamaskSnap } from '@rarimo/rarime-connector';
import { isLocalSnap } from './snap';

export const shouldDisplayReconnectButton = (installedSnap?: MetamaskSnap) =>
  installedSnap && isLocalSnap(installedSnap?.snapId);
