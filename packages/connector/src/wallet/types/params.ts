import type { StdSignDoc } from '@keplr-wallet/types';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import type { ChainInfo } from '@/types';

export type RequestParams<T> = {
  readonly signDoc: T;
  readonly signerAddress: string;
  readonly isADR36?: boolean;
  readonly enableExtraEntropy?: boolean;
  readonly chainId?: string;
};

export type WalletRequestDirectSignParams = RequestParams<
  Omit<SignDoc, 'accountNumber'> & { accountNumber: string }
>;

export type WalletRequestAminoSignParams = RequestParams<StdSignDoc>;

export type WalletRequestGetKeyParams = { chainId: string };

export type WalletRequestSuggestChainParams = {
  chainInfo: ChainInfo;
};
