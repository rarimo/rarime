import {
  BIP44AddressKeyDeriver,
  getBIP44AddressKeyDeriver,
} from '@metamask/key-tree';
import { Wallet, providers } from 'ethers';
import { SUPPORTED_CHAINS } from '../config';

export const getChainInfo = (
  chainId: number,
): {
  rpcUrl: string;
  stateContractAddress: string;
  verifierContractAddress: string;
} => {
  const chainInfo = SUPPORTED_CHAINS[chainId];
  if (!chainInfo) {
    throw new Error(`ChainId ${chainId} not supported`);
  }

  return chainInfo;
};

export const getKeysFromAddressIndex = async (
  addressIndex: number,
  keyDeriver: BIP44AddressKeyDeriver,
) => {
  const { privateKey, address } = await keyDeriver(addressIndex);
  return { privateKey, address };
};

export const getKeysFromAddress = async (
  accountAddress: string,
  maxScan = 20,
) => {
  const bip44Node = await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 60,
    },
  });

  const keyDeriver = await getBIP44AddressKeyDeriver(bip44Node);

  for (let i = 0; i < maxScan; i++) {
    const { address, privateKey } = await getKeysFromAddressIndex(
      i,
      keyDeriver,
    );
    if (accountAddress.toLowerCase() === address.toLowerCase()) {
      return { address, privateKey };
    }
  }
  return null;
};

export const getSigner = async (address: string) => {
  const keys = await getKeysFromAddress(address);
  if (!keys?.privateKey) {
    throw new Error('Private key not found');
  }
  const provider = new providers.Web3Provider(window.ethereum);

  return new Wallet(keys.privateKey, provider);
};
