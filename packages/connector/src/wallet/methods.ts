/* eslint-disable no-invalid-this */

/* eslint @typescript-eslint/prefer-optional-chain: 0 */ // --> OFF
/* eslint jsdoc/match-description: 0 */ // --> OFF
import { AccountData, AminoSignResponse } from '@cosmjs/amino';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import Long from 'long';
import { ethers } from 'ethers';
import {
  ChainInfo,
  SignAminoOptions,
  StdSignDoc,
  SuggestChainOptions,
} from './zkp/types';
import { MetamaskSnap } from './snap';
import Chains from './constants/chainInfo';
import { getGasPriceForChainName } from './helper/gas';

/**
 *
 * @param this
 * @param chainId
 * @param signerAddress
 * @param signDoc
 */
export async function requestSignature(
  this: MetamaskSnap,
  chainId: string,
  signerAddress: string,
  signDoc: SignDoc,
) {
  const signature = await sendSnapMethod(
    {
      method: 'signDirect',
      params: {
        chainId,
        signerAddress,
        signDoc: {
          ...signDoc,
          accountNumber: Long.fromString(
            signDoc.accountNumber.toString(),
            true,
          ),
        },
      },
    },
    this.snapId,
  );

  const modifiedSignature = {
    signature: signature.signature,
    signed: {
      ...signature.signed,
      accountNumber: signDoc.accountNumber.toString(),
      authInfoBytes: new Uint8Array(
        Object.values(signature.signed.authInfoBytes),
      ),

      bodyBytes: new Uint8Array(Object.values(signature.signed.bodyBytes)),
    },
  };

  return modifiedSignature;
}

/**
 *
 * @param this
 * @param chainId
 * @param signerAddress
 * @param signDoc
 * @param options
 */
export async function requestSignAmino(
  this: MetamaskSnap,
  chainId: string,
  signerAddress: string,
  signDoc: StdSignDoc,
  options?: SignAminoOptions,
) {
  const { isADR36 = false, enableExtraEntropy = false } = options || {};

  if (!isADR36 && chainId !== signDoc.chain_id) {
    throw new Error('Chain ID does not match signer chain ID');
  }

  const chain = Chains[chainId as keyof typeof Chains];
  // Override gasPrice
  if (!options?.preferNoSetFee && chain && chain.denom) {
    const gasPriceFromRegistry = await getGasPriceForChainName(chain.chainName);
    const gas: any =
      'gasLimit' in signDoc.fee ? signDoc.fee.gasLimit : signDoc.fee.gas;
    if (gasPriceFromRegistry) {
      const amount = [
        {
          amount: ethers.BigNumber.from(gasPriceFromRegistry)
            .mul(ethers.BigNumber.from(gas))
            .decimalPlaces(0, 1)
            .toString(),
          denom: chain.denom,
        },
      ];
      signDoc.fee.amount = amount;
    }
  }

  const signResponse = (await sendSnapMethod(
    {
      method: 'signAmino',
      params: {
        chainId,
        signerAddress,
        signDoc,
        isADR36,
        enableExtraEntropy,
      },
    },
    this.snapId,
  )) as AminoSignResponse;

  return signResponse;
}

/**
 *
 * @param this
 * @param chainId
 */
export async function getKey(
  this: MetamaskSnap,
  chainId: string,
): Promise<AccountData> {
  const accountData = await sendSnapMethod(
    {
      method: 'getKey',
      params: {
        chainId,
      },
    },
    this.snapId,
  );

  if (!accountData) {
    throw new Error('No account data found');
  }

  accountData.pubkey = Uint8Array.from(Object.values(accountData.pubkey));

  return accountData as AccountData;
}

/**
 *
 * @param this
 * @param chainInfo
 * @param options
 */
export async function suggestChain(
  this: MetamaskSnap,
  chainInfo: ChainInfo,
  options: SuggestChainOptions,
): Promise<{ message: string; chainInfo: ChainInfo }> {
  if (options && options.force) {
    return await sendSnapMethod(
      {
        method: 'suggestChain',
        params: {
          chainInfo,
        },
      },
      this.snapId,
    );
  }

  const supportedChains =
    (await sendSnapMethod(
      { method: 'getSupportedChains', params: {} },
      this.snapId,
    )) || {};

  if (supportedChains[chainInfo.chainId]) {
    return Promise.resolve({
      message: 'Chain already added successfully',
      chainInfo,
    });
  }

  return await sendSnapMethod(
    {
      method: 'suggestChain',
      params: {
        chainInfo,
      },
    },
    this.snapId,
  );
}

// For supporting existing providers.
export const experimentalSuggestChain = suggestChain;
