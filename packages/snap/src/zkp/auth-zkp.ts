import { fromBigEndian } from '@iden3/js-iden3-core';
import { proving, Token } from '@iden3/js-jwz';
import * as uuid from 'uuid';
import { SaveCredentialsRequestParams } from '@rarimo/rarime-connector';

import { W3CCredential } from '@/zkp/types';
import { defaultMTLevels, defaultMTLevelsOnChain } from '@/zkp/const';
import {
  getGISTProof,
  getNodeAuxValue,
  getProviderChainInfo,
  getRarimoEvmRpcUrl,
  getRarimoStateContractAddress,
  getFileBytes,
  prepareSiblingsStr,
  toGISTProof,
} from '@/zkp/helpers';
import { Identity } from '@/zkp/identity';
import { config } from '@/config';

export class AuthZkp {
  identity: Identity = {} as Identity;

  offer: SaveCredentialsRequestParams = {} as SaveCredentialsRequestParams;

  verifiableCredentials: W3CCredential[] = [];

  constructor(identity: Identity, offer: SaveCredentialsRequestParams) {
    this.identity = identity;
    this.offer = offer;
  }

  async getVerifiableCredentials(): Promise<W3CCredential[]> {
    const credentials: W3CCredential[] = [];

    for (let index = 0; index < this.offer.body.Credentials.length; index++) {
      const guid = uuid.v4();

      const claimDetails = {
        id: this.offer?.id ?? guid,
        typ: this.offer?.typ || 'application/iden3-zkp-json',
        type: 'https://iden3-communication.io/credentials/1.0/fetch-request',
        threadID: this.offer?.threadID ?? guid,
        body: {
          id: this.offer?.body.Credentials[index].id,
        },
        from: this.offer.to,
        to: this.offer.from,
      };

      const token2 = new Token(
        proving.provingMethodGroth16AuthV2Instance,
        JSON.stringify(claimDetails),
        this.#prepareInputs.bind(this),
      );

      const [wasm, provingKey] = await Promise.all([
        getFileBytes(config.CIRCUIT_AUTH_WASM_URL),
        getFileBytes(config.CIRCUIT_AUTH_FINAL_KEY_URL),
      ]);

      const jwzTokenRaw = await token2.prove(provingKey, wasm);

      const resp = await fetch(this.offer.body.url, {
        method: 'post',
        body: jwzTokenRaw,
      });

      if (resp.status !== 200) {
        throw new Error(
          `could not fetch W3C credential, ${this.offer?.body.Credentials[index].id}`,
        );
      }
      const data = await resp.json();

      credentials.push(data.body.credential);
    }
    this.verifiableCredentials = credentials;

    return credentials;
  }

  async #prepareInputs(messageHash: Uint8Array): Promise<Uint8Array> {
    const messageHashBigInt = fromBigEndian(messageHash);

    const providerChainInfo = await getProviderChainInfo();

    const signature = this.identity.privateKey.signPoseidon(messageHashBigInt);
    const gistInfo = await getGISTProof({
      rpcUrl: getRarimoEvmRpcUrl(providerChainInfo.id),
      contractAddress: getRarimoStateContractAddress(providerChainInfo.id),
      userId: this.identity.identityIdBigIntString,
    });

    const gistProof = toGISTProof(gistInfo);
    const globalNodeAux = getNodeAuxValue(gistProof.proof);
    const nodeAuxAuth = getNodeAuxValue(this.identity.authClaimNonRevProof);

    const preparedInputs = {
      authClaim: this.identity.coreAuthClaim.marshalJson(),
      authClaimIncMtp: this.identity.authClaimIncProofSiblings,
      authClaimNonRevMtp: prepareSiblingsStr(
        this.identity.authClaimNonRevProof,
        defaultMTLevels,
      ),
      authClaimNonRevMtpAuxHi: nodeAuxAuth.key.string(),
      authClaimNonRevMtpAuxHv: nodeAuxAuth.value.string(),
      authClaimNonRevMtpNoAux: nodeAuxAuth.noAux,
      challenge: messageHashBigInt.toString(),
      challengeSignatureR8x: signature.R8[0].toString(),
      challengeSignatureR8y: signature.R8[1].toString(),
      challengeSignatureS: signature.S.toString(),
      claimsTreeRoot: this.identity.treeState.claimsRoot,
      genesisID: this.identity.identityIdBigIntString,
      revTreeRoot: this.identity.treeState.revocationRoot,
      rootsTreeRoot: this.identity.treeState.rootOfRoots,
      state: this.identity.treeState.state,
      profileNonce: '0',
      gistRoot: gistProof.root.string(),
      gistMtp: prepareSiblingsStr(gistProof.proof, defaultMTLevelsOnChain),
      gistMtpAuxHi: globalNodeAux?.key.string(),
      gistMtpAuxHv: globalNodeAux?.value.string(),
      gistMtpNoAux: globalNodeAux.noAux,
    };

    return new TextEncoder().encode(JSON.stringify(preparedInputs));
  }
}
