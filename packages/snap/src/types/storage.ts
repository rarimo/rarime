import { StorageKeys } from '@/enums';
import { W3CCredential } from '@/zkp/types';

export type StorageMap = {
  [StorageKeys.identity]: {
    privateKeyHex: string;
    did: string;
    didBigInt: string;
  };
  [StorageKeys.credentials]: W3CCredential[];
};
