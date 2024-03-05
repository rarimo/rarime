import { RPCMethods, SnapRequestsResponses } from '@rarimo/rarime-connector';
import { checkIfStateSynced } from '@/zkp/helpers';

export const checkStateContractSync = async (): Promise<
  SnapRequestsResponses[RPCMethods.CheckStateContractSync]
> => {
  return checkIfStateSynced();
};
