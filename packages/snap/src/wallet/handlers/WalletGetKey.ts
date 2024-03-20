import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { getChainDetails, validateChainId } from '@/wallet/chain';
import { generateWallet } from '@/wallet/wallet';

export const walletGetKey = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletGetKey]> => {
  const { chainId } =
    request.params as SnapRequestParams[RPCMethods.WalletGetKey];

  await validateChainId(chainId);

  const chainDetails = await getChainDetails(chainId);

  const wallet = await generateWallet(chainDetails);

  const accounts = wallet.getAccounts();

  return {
    address: accounts[0].address,
    algo: 'secp256k1',
    pubkey: new Uint8Array(Object.values(accounts[0].pubkey)),
  };
};
