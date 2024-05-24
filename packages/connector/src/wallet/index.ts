/* eslint jsdoc/match-description: 0 */ // --> OFF
/* eslint require-atomic-updates: 0 */ // --> OFF
/* eslint jsdoc/require-param: 0 */ // --> OFF

import type { AccountData, AminoSignResponse } from '@cosmjs/amino';
import type {
  DirectSignResponse,
  OfflineDirectSigner,
} from '@cosmjs/proto-signing';
import type { StdSignDoc } from '@keplr-wallet/types';
import type { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { BigNumber } from 'ethers';

import { defaultSnapOrigin, RARIMO_CHAINS, TARGET_CHAINS } from '@/consts';
import { RPCMethods } from '@/enums';
import { RarimeSnapBase } from '@/instances';
import versionJson from '@/version.json';

export class RarimeWallet
  extends RarimeSnapBase
  implements OfflineDirectSigner
{
  readonly chainId: string;

  public constructor(
    chainId: string,
    snapId = defaultSnapOrigin,
    version = versionJson.version,

    supportedRarimoChains = RARIMO_CHAINS,
    supportedTargetZkpChains = TARGET_CHAINS,
  ) {
    super(snapId, version, supportedRarimoChains, supportedTargetZkpChains);

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
    options?: {
      preferNoSetFee?: boolean;
      isADR36?: boolean;
      enableExtraEntropy?: boolean;
    },
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

    return this.sendSnapRequest(RPCMethods.WalletSignAmino, {
      chainId: this.chainId,
      signerAddress,
      signDoc,
      isADR36,
      enableExtraEntropy,
    });
  }
}

export * from './types';
