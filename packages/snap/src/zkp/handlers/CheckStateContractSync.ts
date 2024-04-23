import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { checkIfStateSynced } from '@rarimo/rarime-connector';

import { getChains } from '@/helpers';

export const checkStateContractSync = async ({
  request,
}: {
  request: JsonRpcRequest;
}): Promise<SnapRequestsResponses[RPCMethods.CheckStateContractSync]> => {
  const [rarimoChainId, targetChainId] =
    request.params as SnapRequestParams[RPCMethods.CheckStateContractSync];

  const { rarimoChain, targetChain } = await getChains(
    rarimoChainId,
    targetChainId,
  );

  return checkIfStateSynced(
    rarimoChain.rpc,
    rarimoChain.stateContractAddress,
    targetChain.targetRpcUrl,
    targetChain.targetStateContractAddress,
  );
};
