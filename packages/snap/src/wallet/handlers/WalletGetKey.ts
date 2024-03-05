import type { JsonRpcRequest } from '@metamask/utils';
import {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { generateWallet, getChainDetails, validateChainId } from '@/wallet';

export const walletGetKey = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletGetKey]> => {
  const {
    chainId,
  } = request.params as SnapRequestParams[RPCMethods.WalletGetKey];

  await validateChainId(chainId);

  const chainDetails = await getChainDetails(chainId);

  const wallet = await generateWallet(chainDetails);

  const accounts = wallet.getAccounts();

  return {
    address: accounts[0].address,
    algo: 'secp256k1',
    bech32Address: accounts[0].address,
    isNanoLedger: false,
    name: 'Cosmos',
    pubkey: new Uint8Array(Object.values(accounts[0].pubkey)),
  };
};
