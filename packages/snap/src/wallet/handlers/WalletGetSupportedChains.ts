import type {
  RPCMethods,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { getAllChains } from '@/wallet/chain';

export const walletGetSupportedChains = async (): Promise<
  SnapRequestsResponses[RPCMethods.WalletGetSupportedChains]
> => {
  return await getAllChains();
};
