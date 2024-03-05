/* eslint jsdoc/match-description: 0 */ // --> OFF
/* eslint require-atomic-updates: 0 */ // --> OFF
/* eslint jsdoc/require-param: 0 */ // --> OFF

import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { AccountData, AminoSignResponse } from '@cosmjs/amino';
import { DirectSignResponse, OfflineDirectSigner } from '@cosmjs/proto-signing';
import { BigNumber } from 'ethers';
import versionJson from '../version.json';
import { SignAminoOptions, StdSignDoc } from './types';
import { CHAINS } from './consts';
import { getGasPriceForChainName } from './helpers';
import { defaultSnapOrigin } from '@/consts';
import { RPCMethods } from '@/enums';
import { RarimeSnapBase } from '@/instances';

export class RarimeWallet
  extends RarimeSnapBase
  implements OfflineDirectSigner {
  readonly chainId: string;

  public constructor(
    chainId: string,
    snapId = defaultSnapOrigin,
    version = versionJson.version,
  ) {
    super(snapId, version);
    this.chainId = chainId;
  }

  async getAccounts(): Promise<AccountData[]> {
    const accountData = await this.sendSnapRequest(RPCMethods.WalletGetKey, {
      chainId: this.chainId,
    });

    if (!accountData) {
      throw new Error('No account data found');
    }

    return [
      {
        address: accountData.address,
        algo: 'secp256k1',
        pubkey: Uint8Array.from(Object.values(accountData.pubkey)),
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

    const signature = await this.sendSnapRequest(RPCMethods.WalletSignDirect, {
      chainId: this.chainId,
      signerAddress,
      signDoc: {
        ...signDoc,
        accountNumber: signDoc.accountNumber.toString(),
      },
    });

    return {
      signature: signature.signature,
      signed: {
        ...signature.signed,
        accountNumber: BigNumber.from(
          signDoc.accountNumber.toString(),
        ).toBigInt(),
        authInfoBytes: new Uint8Array(
          Object.values(signature.signed.authInfoBytes),
        ),

        bodyBytes: new Uint8Array(Object.values(signature.signed.bodyBytes)),
      },
    };
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

    const { isADR36 = false, enableExtraEntropy = false } = options || {};

    if (!isADR36 && this.chainId !== signDoc.chain_id) {
      throw new Error('Chain ID does not match signer chain ID');
    }

    const chain = CHAINS[this.chainId as keyof typeof CHAINS];

    // Override gasPrice
    if (!options?.preferNoSetFee) {
      const gasPriceFromRegistry = await getGasPriceForChainName(
        chain.chainName,
      );

      const gas: any =
        'gasLimit' in signDoc.fee ? signDoc.fee.gasLimit : signDoc.fee.gas;

      if (gasPriceFromRegistry) {
        const amount = [
          {
            amount: BigNumber.from(
              BigNumber.from(gasPriceFromRegistry)
                .mul(BigNumber.from(gas))
                .toNumber()
                .toFixed(0),
            ).toString(),

            denom: chain.currencies[0].coinDenom,
          },
        ];
        signDoc.fee.amount = amount;
      }
    }

    return this.sendSnapRequest(RPCMethods.WalletSignAmino, {
      chainId: this.chainId,
      signerAddress,
      signDoc,
      isADR36,
      enableExtraEntropy,
    });
  }
}

// export const createWallet = (chainId: string) => {};

export * from './consts';
export * from './helpers';
export * from './types';

// /**
//  * Helps to do signArbitrary of the data provided
//  *
//  * @param chainId - chainId
//  * @param signer - signer
//  * @param data - data
//  * @returns signature
//  */
// export async function signArbitrary(
//   chainId: string,
//   signer: string,
//   data: string,
//   signOptions?: { enableExtraEntropy?: boolean },
// ) {
//   const { signDoc } = getADR36SignDoc(signer, data);
//   const result = await requestSignAmino.bind(this)(chainId, signer, signDoc, {
//     isADR36: true,
//     preferNoSetFee: true,
//     enableExtraEntropy: signOptions?.enableExtraEntropy,
//   });
//   return result.signature;
// }
//
// /**
//  *
//  * Gets the getADR36SignDoc of the signer and data
//  *
//  * @param signer - signer
//  * @param data - data
//  * @returns SignDoc and isADR36WithString
//  */
// function getADR36SignDoc(
//   signer: string,
//   data: string | Uint8Array,
// ): { signDoc: StdSignDoc; isADR36WithString: boolean } {
//   let isADR36WithString = false;
//   let b64Data = '';
//   if (typeof data === 'string') {
//     b64Data = Buffer.from(data).toString('base64');
//     isADR36WithString = true;
//   } else {
//     b64Data = Buffer.from(data).toString('base64');
//   }
//   const signDoc = {
//     chain_id: '',
//     account_number: '0',
//     sequence: '0',
//     fee: {
//       gas: '0',
//       amount: [],
//     },
//     msgs: [
//       {
//         type: 'sign/MsgSignData',
//         value: {
//           signer,
//           b64Data,
//         },
//       },
//     ],
//     memo: '',
//   };
//   return { signDoc, isADR36WithString };
// }
