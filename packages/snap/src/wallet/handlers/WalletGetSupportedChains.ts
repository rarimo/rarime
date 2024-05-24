import type {
  RPCMethods,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { RarimoChainsManager } from '@/helpers';

export const walletGetSupportedChains = async (): Promise<
  SnapRequestsResponses[RPCMethods.WalletGetSupportedChains]
> => {
  const rarimoChainsManager = await RarimoChainsManager.create();

  return rarimoChainsManager.rarimoChains;
};
