import type { Pubkey, StdSignature, StdSignDoc } from '@cosmjs/amino';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';
import * as secp from '@noble/secp256k1';
import * as base64js from 'base64-js';
import { bech32 } from 'bech32';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';

export const encodeSecp256k1Pubkey = (pubkey: Uint8Array): Pubkey => {
  if (pubkey.length !== 33 || (pubkey[0] !== 0x02 && pubkey[0] !== 0x03)) {
    throw new TypeError(
      'Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03',
    );
  }

  return {
    type: 'tendermint/PubKeySecp256k1',
    value: base64js.fromByteArray(pubkey),
  };
};

export const encodeSecp256k1Signature = (
  pubkey: Uint8Array,
  signature: Uint8Array,
): StdSignature => {
  if (signature.length !== 64) {
    throw new TypeError(
      'Signature must be 64 bytes long. Cosmos SDK uses a 2x32 byte fixed length encoding for the secp256k1 signature integers r and s.',
    );
  }

  return {
    pub_key: encodeSecp256k1Pubkey(pubkey),
    signature: base64js.fromByteArray(signature),
  };
};

export const sortObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};

  for (const key of sortedKeys) {
    result[key] = sortObject(obj[key]);
  }

  return result;
};

export const serializeSignDoc = (signDoc: SignDoc) => {
  return SignDoc.encode(
    SignDoc.fromPartial({
      accountNumber: signDoc.accountNumber,
      authInfoBytes: signDoc.authInfoBytes,
      bodyBytes: signDoc.bodyBytes,
      chainId: signDoc.chainId,
    }),
  ).finish();
};

export const serializeStdSignDoc = (signDoc: StdSignDoc) => {
  const json = JSON.stringify(sortObject(signDoc));
  return new TextEncoder().encode(json);
};

const pubkeyToAddress = (publicKey: Uint8Array, addressPrefix: string) => {
  const pubKeyHash = ripemd160(sha256(publicKey));
  return bech32.encode(addressPrefix, bech32.toWords(pubKeyHash));
};

export type WalletOptions = {
  addressPrefix: string;
  coinType: number;
};

export class Wallet {
  readonly #privateKey: Uint8Array;

  readonly #pubkey: Uint8Array;

  readonly #address: string;

  constructor(privateKey: Uint8Array, publicKey: Uint8Array, address: string) {
    this.#privateKey = privateKey;
    this.#pubkey = publicKey;
    this.#address = address;
  }

  static create(privateKey: string, addressPrefix: string) {
    const sanitizedPvtKey = privateKey.replace('0x', '');
    const pvtKeyBytes = Buffer.from(sanitizedPvtKey, 'hex');

    const publicKey = secp.getPublicKey(pvtKeyBytes, true);
    const pubAddress = pubkeyToAddress(publicKey, addressPrefix);
    return new Wallet(pvtKeyBytes, publicKey, pubAddress);
  }

  getAccounts() {
    return [
      {
        address: this.#address,
        algo: 'secp256k1',
        pubkey: this.#pubkey,
      },
    ];
  }

  async signDirect(signerAddress: string, signDoc: SignDoc) {
    const accounts = this.getAccounts();

    const account = accounts.find((acc) => acc.address === signerAddress);

    if (!account) {
      throw new TypeError('Signer address does not match wallet address');
    }

    const hash = sha256(serializeSignDoc(signDoc));

    const signature = await secp.sign(hash, this.#privateKey, {
      canonical: true,
      extraEntropy: true,
      der: false,
    });

    const resp = {
      signed: { ...signDoc, accountNumber: signDoc.accountNumber.toString() },
      signature: encodeSecp256k1Signature(account.pubkey, signature),
    };

    return resp;
  }

  async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc,
    options?: { extraEntropy: boolean },
  ) {
    const accounts = this.getAccounts();
    const account = accounts.find((acc) => acc.address === signerAddress);
    if (!account) {
      throw new TypeError('Signer address does not match wallet address');
    }

    if (!account.pubkey) {
      throw new TypeError('Unable to derive keypair');
    }
    const hash = sha256(serializeStdSignDoc(signDoc));
    const extraEntropy = options?.extraEntropy ? true : undefined;
    const signature = await secp.sign(hash, this.#privateKey, {
      // canonical: true,
      extraEntropy,
      // der: false,
    });

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(account.pubkey, signature),
    };
  }
}

export const generateWallet = async (
  options: WalletOptions,
): Promise<Wallet> => {
  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  if (!identityStorage.privateKeyHex) {
    throw new TypeError('No private key found');
  }

  return Wallet.create(identityStorage.privateKeyHex, options.addressPrefix);
};
