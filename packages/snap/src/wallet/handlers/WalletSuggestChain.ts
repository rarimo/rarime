import { panel } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { RarimoChainsManager } from '@/helpers';
import { getChainPanel } from '@/wallet/ui';

export const walletSuggestChain = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletSuggestChain]> => {
  const { chainInfo } =
    request.params as SnapRequestParams[RPCMethods.WalletSuggestChain];

  RarimoChainsManager.validateChain(chainInfo);

  const panels = getChainPanel(origin, chainInfo);

  const confirmed = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel(panels),
    },
  });
  if (!confirmed) {
    throw new Error('User denied transaction');
  }

  const rarimoChainsManager = await RarimoChainsManager.create();

  await rarimoChainsManager.addChain(chainInfo);

  // await addChain(chainInfo);

  return { message: 'Successfully added chain', chainInfo };
};
