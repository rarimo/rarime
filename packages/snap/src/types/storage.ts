import type { ChainInfo } from '@rarimo/rarime-connector';

import type { StorageKeys } from '@/enums';
import type { W3CCredential } from '@/zkp/types';

export type StorageMap = {
  [StorageKeys.identity]: {
    privateKeyHex: string;
    did: string;
    didBigInt: string;
  };
  [StorageKeys.credentials]: W3CCredential[];
  [StorageKeys.chains]: Record<string, ChainInfo>;
};
