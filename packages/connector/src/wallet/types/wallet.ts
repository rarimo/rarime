import type { AminoMsg, Coin } from '@cosmjs/amino';

export type SignAminoOptions = {
  preferNoSetFee?: boolean;
  isADR36?: boolean;
  enableExtraEntropy?: boolean;
};

export type StdFee = {
  amount: readonly Coin[];
  readonly gas: string;
  gasLimit?: string;
  /** The granter address that is used for paying with feegrants */
  readonly granter?: string;
  /** The fee payer address. The payer must have signed the transaction. */
  readonly payer?: string;
};

export type StdSignDoc = {
  readonly chain_id?: string;
  readonly chainId?: string;
  readonly account_number: string;
  readonly accountNumber?: string;
  readonly sequence: string;
  readonly fee: StdFee;
  readonly msgs: readonly AminoMsg[];
  readonly memo: string;
};

export type Pubkey = {
  readonly type: string;
  readonly value: any;
};

export type StdSignature = {
  readonly pub_key: Pubkey;
  readonly signature: string;
};

export type WalletSignDirectResponse = {
  signed: {
    accountNumber: string;
    bodyBytes: Uint8Array;
    authInfoBytes: Uint8Array;
    chainId: string;
  };
  signature: StdSignature;
};
