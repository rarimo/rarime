import type {
  RPCMethods,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { checkIfStateSynced } from '@rarimo/rarime-connector';

import { getProviderChainInfo } from '@/zkp/helpers';

export const checkStateContractSync = async (): Promise<
  SnapRequestsResponses[RPCMethods.CheckStateContractSync]
> => {
  const chainInfo = await getProviderChainInfo();

  return checkIfStateSynced(chainInfo);
};
