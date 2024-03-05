import type { JsonRpcRequest } from '@metamask/utils';
import {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { panel } from '@metamask/snaps-sdk';
import { addChain, validateChain } from '@/wallet';
import { getChainPanel } from '@/wallet/ui';

export const walletSuggestChain = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletSuggestChain]> => {
  const {
    chainInfo,
  } = request.params as SnapRequestParams[RPCMethods.WalletSuggestChain];

  validateChain(chainInfo);
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

  await addChain(chainInfo);

  return { message: 'Successfully added chain', chainInfo };
};
