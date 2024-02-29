/* eslint jsdoc/match-description: 0 */ // --> OFF
/* eslint require-atomic-updates: 0 */ // --> OFF
/* eslint jsdoc/require-param: 0 */ // --> OFF

import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { AccountData, AminoSignResponse } from '@cosmjs/amino';
import { DirectSignResponse, OfflineDirectSigner } from '@cosmjs/proto-signing';
import { getKey, requestSignAmino, requestSignature } from '../methods';
import { SignAminoOptions, StdSignDoc } from '../zkp/types';

export class CosmjsOfflineSigner implements OfflineDirectSigner {
  readonly chainId: string;

  constructor(chainId: string) {
    this.chainId = chainId;
  }

  async getAccounts(): Promise<AccountData[]> {
    const key = await getKey.bind(this)(this.chainId);
    return [
      {
        address: key.address,
        algo: 'secp256k1',
        pubkey: key.pubkey,
      },
    ];
  }

  async signDirect(
    signerAddress: string,
    signDoc: SignDoc,
  ): Promise<DirectSignResponse> {
    if (this.chainId !== signDoc.chainId) {
      throw new Error('Chain ID does not match signer chain ID');
    }
    const accounts = await this.getAccounts();

    if (accounts.find((account) => account.address !== signerAddress)) {
      throw new Error('Signer address does not match wallet address');
    }

    return requestSignature.bind(this)(
      this.chainId,
      signerAddress,
      signDoc,
    ) as Promise<DirectSignResponse>;
  }

  // This has been added as a placeholder.
  async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc,
    options?: SignAminoOptions,
  ): Promise<AminoSignResponse> {
    if (this.chainId !== signDoc.chain_id) {
      throw new Error('Chain ID does not match signer chain ID');
    }
    const accounts = await this.getAccounts();

    if (accounts.find((account) => account.address !== signerAddress)) {
      throw new Error('Signer address does not match wallet address');
    }

    return (requestSignAmino.bind(this)(
      this.chainId,
      signerAddress,
      signDoc,
      options,
    ) as unknown) as Promise<AminoSignResponse>;
  }
}

/**
 * Gives the cosmos Offline signer
 *
 * @param chainId - chainId
 * @returns CosmjsOfflineSigner
 */
export function getOfflineSigner(chainId: string) {
  return new CosmjsOfflineSigner(chainId);
}

/**
 * Helps to do signArbitrary of the data provided
 *
 * @param chainId - chainId
 * @param signer - signer
 * @param data - data
 * @returns signature
 */
export async function signArbitrary(
  chainId: string,
  signer: string,
  data: string,
  signOptions?: { enableExtraEntropy?: boolean },
) {
  const { signDoc } = getADR36SignDoc(signer, data);
  const result = await requestSignAmino.bind(this)(chainId, signer, signDoc, {
    isADR36: true,
    preferNoSetFee: true,
    enableExtraEntropy: signOptions?.enableExtraEntropy,
  });
  return result.signature;
}

/**
 *
 * Gets the getADR36SignDoc of the signer and data
 *
 * @param signer - signer
 * @param data - data
 * @returns SignDoc and isADR36WithString
 */
function getADR36SignDoc(
  signer: string,
  data: string | Uint8Array,
): { signDoc: StdSignDoc; isADR36WithString: boolean } {
  let isADR36WithString = false;
  let b64Data = '';
  if (typeof data === 'string') {
    b64Data = Buffer.from(data).toString('base64');
    isADR36WithString = true;
  } else {
    b64Data = Buffer.from(data).toString('base64');
  }
  const signDoc = {
    chain_id: '',
    account_number: '0',
    sequence: '0',
    fee: {
      gas: '0',
      amount: [],
    },
    msgs: [
      {
        type: 'sign/MsgSignData',
        value: {
          signer,
          b64Data,
        },
      },
    ],
    memo: '',
  };
  return { signDoc, isADR36WithString };
}
