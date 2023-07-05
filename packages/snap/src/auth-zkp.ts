import { fromBigEndian } from '@iden3/js-iden3-core';
import { proving, Token } from '@iden3/js-jwz';
import * as uuid from 'uuid';
import { type Identity } from './identity';

import { config } from './config';
import { W3CCredential, ClaimOffer } from './types';
import { getGISTProof, readBytesFile } from './helpers';

export class AuthZkp {
  identity: Identity = {} as Identity;

  offer: ClaimOffer = {} as ClaimOffer;

  verifiableCredentials: W3CCredential[] = [];

  constructor(identity: Identity, offer: ClaimOffer) {
    this.identity = identity;
    this.offer = offer;
  }

  async getVerifiableCredentials(): Promise<W3CCredential[]> {
    const credentials: W3CCredential[] = [];

    for (let index = 0; index < this.offer.body.credentials.length; index++) {
      const guid = uuid.v4();

      const claimDetails = {
        id: this.offer?.id ?? guid,
        typ: this.offer?.typ || 'application/iden3-zkp-json',
        type: 'https://iden3-communication.io/credentials/1.0/fetch-request',
        thid: this.offer?.thid ?? guid,
        body: {
          id: this.offer?.body.credentials[index].id,
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
        readBytesFile(config.CIRCUIT_AUTH_WASM_URL),
        readBytesFile(config.CIRCUIT_AUTH_FINAL_KEY_URL),
      ]);

      const jwzTokenRaw = await token2.prove(provingKey, wasm);
      const resp = await fetch(this.offer.body.url, {
        method: 'post',
        body: jwzTokenRaw,
      });

      if (resp.status !== 200) {
        throw new Error(
          `could not fetch W3C credential, ${this.offer?.body.credentials[index].id}`,
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

    const signature = this.identity.privateKey.signPoseidon(messageHashBigInt);
    const gistInfo = await getGISTProof({
      rpcUrl: config.RPC_URL,
      contractAddress: config.STATE_V2_ADDRESS,
      userId: this.identity.identityIdBigIntString,
    });

    const preparedInputs = {
      authClaim: [...this.identity.authClaimInput],
      authClaimIncMtp: [
        ...this.identity.authClaimIncProofSiblings.map((el) => el.string()),
      ],
      authClaimNonRevMtp: [
        ...this.identity.authClaimNonRevProofSiblings.map((el) => el.string()),
      ],
      authClaimNonRevMtpAuxHi: '0',
      authClaimNonRevMtpAuxHv: '0',
      authClaimNonRevMtpNoAux: '1',
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
      gistRoot: gistInfo?.root.toString(),
      gistMtp: gistInfo?.siblings?.map?.((el: unknown) => el?.toString()) ?? [],
      gistMtpAuxHi: gistInfo?.auxIndex.toString(),
      gistMtpAuxHv: gistInfo?.auxValue.toString(),
      gistMtpNoAux: gistInfo?.auxExistence ? '0' : '1',
    };

    return new TextEncoder().encode(JSON.stringify(preparedInputs));
  }
}
