import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { RarimoChainsManager } from '@/helpers';
import { generateWallet } from '@/wallet/wallet';

export const walletGetKey = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.WalletGetKey]> => {
  const { chainId } =
    request.params as SnapRequestParams[RPCMethods.WalletGetKey];

  const rarimoChainsManager = await RarimoChainsManager.create();

  if (!rarimoChainsManager.isChainExist(chainId)) {
    throw new Error('Invalid chainId');
  }

  const rarimoChain = rarimoChainsManager.getChainDetails(chainId);

  const wallet = await generateWallet({
    addressPrefix: rarimoChain?.bech32Config?.bech32PrefixAccAddr,
    coinType: rarimoChain?.bip44?.coinType,
  });

  const accounts = wallet.getAccounts();

  return {
    address: accounts[0].address,
    algo: 'secp256k1',
    pubkey: new Uint8Array(Object.values(accounts[0].pubkey)),
  };
};
