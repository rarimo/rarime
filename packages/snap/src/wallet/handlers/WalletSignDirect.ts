import { panel } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import Long from 'long';

import { getChainDetails, validateChainId } from '@/wallet/chain';
import { parser } from '@/wallet/helpers';
import { generateWallet } from '@/wallet/wallet';

export const walletSignDirect = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletSignDirect]> => {
  const params =
    request.params as unknown as SnapRequestParams[RPCMethods.WalletSignDirect];

  const panels = parser.parse(
    params.signDoc as unknown as SignDoc,
    origin,
    'direct',
  );

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

  await validateChainId(signDoc.chainId);

  const { low, high, unsigned } = Long.fromString(signDoc.accountNumber, true);

  const chainDetails = await getChainDetails(signDoc.chainId);

  const wallet = await generateWallet(chainDetails);

  const accountNumber = new Long(low, high, unsigned);

  return wallet.signDirect(signerAddress, {
    bodyBytes: new Uint8Array(Object.values(signDoc.bodyBytes)),
    authInfoBytes: new Uint8Array(Object.values(signDoc.authInfoBytes)),
    chainId: signDoc.chainId,
    accountNumber: accountNumber as unknown as bigint,
  });
};
