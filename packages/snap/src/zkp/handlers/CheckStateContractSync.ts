import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { checkIfStateSynced } from '@rarimo/rarime-connector';

export const checkStateContractSync = async ({
  request,
}: {
  request: JsonRpcRequest;
}): Promise<SnapRequestsResponses[RPCMethods.CheckStateContractSync]> => {
  const [coreChainInfo, targetChainInfo] =
    request.params as SnapRequestParams[RPCMethods.CheckStateContractSync];

  return checkIfStateSynced(
    coreChainInfo.rpc,
    coreChainInfo.stateContractAddress,
    targetChainInfo.targetRpcUrl,
    targetChainInfo.targetStateContractAddress,
  );
};
