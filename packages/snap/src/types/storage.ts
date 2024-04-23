import type { ChainInfo, ChainZkpInfo } from '@rarimo/rarime-connector';
import type { W3CCredential } from '@rarimo/zkp-iden3';

import type { StorageKeys } from '@/enums';

export type StorageMap = {
  [StorageKeys.identity]: {
    privateKeyHex: string;
    did: string;
    didBigInt: string;
  };
  [StorageKeys.credentials]: W3CCredential[];
  [StorageKeys.chains]: Record<string, ChainInfo>;
  [StorageKeys.rarimoChains]: Record<string, ChainInfo>;
  [StorageKeys.targetChains]: Record<string, ChainZkpInfo>;
};
