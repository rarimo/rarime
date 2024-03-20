import { panel } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { getChainDetails, validateChainId } from '@/wallet/chain';
import { parser } from '@/wallet/helpers';
import { generateWallet } from '@/wallet/wallet';

export const walletSignAmino = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletSignAmino]> => {
  const params =
    request.params as unknown as SnapRequestParams[RPCMethods.WalletSignAmino];
  const panels = parser.parse(params.signDoc, origin, 'amino');

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

  const { signerAddress, signDoc } = params;

  const receivedChainId =
    params.chainId || signDoc.chain_id || signDoc.chainId || '';

  if (!receivedChainId) {
    throw new Error('ChainId is mandatory params');
  }

  if (!params.isADR36) {
    await validateChainId(receivedChainId);
  }

  const chainDetails = await getChainDetails(receivedChainId);

  const wallet = await generateWallet(chainDetails);

  const defaultFee = signDoc.fee;
  const defaultMemo = signDoc.memo;

  const sortedSignDoc = {
    chain_id: receivedChainId,
    account_number: signDoc.account_number ?? signDoc.accountNumber,
    sequence: signDoc.sequence,
    fee: defaultFee,
    memo: defaultMemo,
    msgs: signDoc.msgs,
  };

  return wallet.signAmino(signerAddress, sortedSignDoc, {
    extraEntropy: params.enableExtraEntropy ? params.enableExtraEntropy : false,
  });
};
