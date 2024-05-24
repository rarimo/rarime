import type { StdSignature } from '@keplr-wallet/types';

export type WalletSignDirectResponse = {
  signed: {
    accountNumber: string;
    bodyBytes: Uint8Array;
    authInfoBytes: Uint8Array;
    chainId: string;
  };
  signature: StdSignature;
};
