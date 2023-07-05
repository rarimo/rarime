import { Buffer } from 'buffer';
import { arrayify } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/keccak256';
import { Hex, Signature } from '@iden3/js-crypto';
import {
  Claim,
  ClaimOptions,
  DID,
  fromLittleEndian,
  SchemaHash,
} from '@iden3/js-iden3-core';
import {
  Merklizer,
  type MtValue,
  type Path,
} from '@iden3/js-jsonld-merklization';
import { proving, type ZKProof } from '@iden3/js-jwz';
import {
  circomSiblingsFromSiblings,
  hashElems,
  newHashFromHex,
  Proof,
} from '@iden3/js-merkletree';

import { type Identity } from './identity';

import { getGISTProof, readBytesFile, unmarshalBinary } from './helpers';
import type { ClaimStatus, IssuerState, W3CCredential } from './types';
import { config } from './config';
import {
  defaultMTLevels,
  defaultMTLevelsClaimsMerklization,
  defaultMTLevelsOnChain,
  defaultValueArraySize,
} from './const';

const ensureArraySize = (arr: string[], size: number): string[] => {
  if (arr.length < size) {
    const newArr = new Array(size - arr.length).fill('0');
    return arr.concat(newArr);
  }
  return arr;
};

export class ZkpGen {
  identity: Identity = {} as Identity;

  verifiableCredential: W3CCredential = {} as W3CCredential;

  subjectProof: ZKProof = {} as ZKProof;

  constructor(identity: Identity, verifiableCredential: W3CCredential) {
    this.identity = identity;
    this.verifiableCredential = verifiableCredential;
  }

  async generateProof() {
    const inputs = await this.#prepareInputs();

    const [wasm, provingKey] = await Promise.all([
      readBytesFile(config.CIRCUIT_MTP_WASM_URL),
      readBytesFile(config.CIRCUIT_MTP_FINAL_KEY_URL),
    ]);
    this.subjectProof = await proving.provingMethodGroth16AuthV2Instance.prove(
      new TextEncoder().encode(inputs),
      provingKey,
      wasm,
    );

    return this.subjectProof;
  }

  async #prepareInputs() {
    // ==================== USER SIDE ======================
    const challenge = fromLittleEndian(Hex.decodeString('')); // TODO

    const signatureChallenge = this.identity.privateKey.signPoseidon(challenge);

    const gistInfo = await getGISTProof({
      rpcUrl: config.RPC_URL,
      contractAddress: config.STATE_V2_ADDRESS,
      userId: this.identity.identityIdBigIntString,
    });

    const userClaimStatus = await this.#requestClaimRevocationStatus(
      this.verifiableCredential.credentialStatus.revocationNonce!,
    );

    // ==================== ISSUER SIDE ======================

    const [credentialSigProof] = this.verifiableCredential.proof!;

    const issuerAuthCoreClaim = new Claim();
    issuerAuthCoreClaim.fromHex(credentialSigProof.coreClaim);

    const issuerRevNonce = issuerAuthCoreClaim.getRevocationNonce();

    const issuerAuthClaimStatus = await this.#requestClaimRevocationStatus(
      Number(issuerRevNonce),
    );

    const issuerID = DID.parse(this.verifiableCredential.issuer).id;
    const signatureProof = this.#parseBJJSignatureProof();

    const { path, claimProof } = await this.#createCoreClaimFromIssuer();

    // ==================== SETUP SIDE ======================

    const timestamp = Math.floor(Date.now() / 1000);

    const value = new Array(defaultValueArraySize);
    value.fill('0');
    value[0] =
      this.verifiableCredential.credentialSubject?.isNatural.toString();

    const dd = this.verifiableCredential.proof?.[1]?.coreClaim;
    const claim = new Claim().fromHex(dd as string);

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: '1',

      /* userID ownership signals */
      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      /* user state */
      userState: this.identity.treeState.state,
      userClaimsTreeRoot: this.identity.treeState.claimsRoot,
      userRevTreeRoot: this.identity.treeState.revocationRoot,
      userRootsTreeRoot: this.identity.treeState.rootOfRoots,

      /* Auth claim */
      authClaim: [...this.identity.authClaimInput],

      /* auth claim. merkle tree proof of inclusion to claim tree */
      authClaimIncMtp: [
        ...this.identity.authClaimIncProofSiblings.map((el) => el.string()),
      ],

      /* auth claim - rev nonce. merkle tree proof of non-inclusion to rev tree */
      authClaimNonRevMtp: [
        ...this.identity.authClaimNonRevProofSiblings.map((el) => el.string()),
      ],
      authClaimNonRevMtpNoAux: '1',
      authClaimNonRevMtpAuxHi: '0',
      authClaimNonRevMtpAuxHv: '0',

      /* challenge signature */
      challenge: challenge.toString(),
      challengeSignatureR8x: signatureChallenge!.R8[0].toString(),
      challengeSignatureR8y: signatureChallenge!.R8[1].toString(),
      challengeSignatureS: signatureChallenge!.S.toString(),

      // global identity state tree on chain
      gistRoot: gistInfo?.root.toString(),
      /* proof of inclusion or exclusion of the user in the global state */
      gistMtp: ensureArraySize(
        gistInfo?.siblings.map((el) => el.toString()),
        defaultMTLevelsOnChain,
      ),
      gistMtpAuxHi: gistInfo?.auxIndex.toString(),
      gistMtpAuxHv: gistInfo?.auxValue.toString(),
      gistMtpNoAux: gistInfo?.auxExistence ? '0' : '1',

      /* issuerClaim signals */
      claimSubjectProfileNonce: '0',

      /* issuer ID */
      issuerID: issuerID.bigInt().toString(),

      /* issuer auth proof of existence */
      issuerAuthClaim: signatureProof.issuerAuthClaim,
      issuerAuthClaimMtp: signatureProof.issuerAuthClaimIncProof,
      issuerAuthClaimsTreeRoot: signatureProof.claimsTreeRoot.string(),
      issuerAuthRevTreeRoot: signatureProof.revocationTreeRoot.string(),
      issuerAuthRootsTreeRoot: signatureProof.rootOfRoots.string(),
      // issuerAuthState: signatureProof.issuerState.state.string(),

      /* issuer auth claim non rev proof */
      issuerAuthClaimNonRevMtp: ensureArraySize(
        issuerAuthClaimStatus.mtp.siblings.map((el) => el.string()),
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: '1',
      issuerAuthClaimNonRevMtpAuxHi: '0',
      issuerAuthClaimNonRevMtpAuxHv: '0',

      /* claim issued by issuer to the user */
      issuerClaim: claim.marshalJson(),
      /* issuerClaim non rev inputs */
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: ensureArraySize(
        userClaimStatus.mtp.siblings.map((el) => el.string()),
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux:
        Boolean(userClaimStatus.mtp?.nodeAux?.key) &&
        Boolean(userClaimStatus.mtp?.nodeAux?.value)
          ? 0
          : 1,
      issuerClaimNonRevMtpAuxHi: userClaimStatus.mtp?.nodeAux?.key ?? 0,
      issuerClaimNonRevMtpAuxHv: userClaimStatus.mtp?.nodeAux?.value ?? 0,
      issuerClaimNonRevClaimsTreeRoot: newHashFromHex(
        String(userClaimStatus.issuer.claimsTreeRoot),
      ).string(),
      issuerClaimNonRevRevTreeRoot: newHashFromHex(
        String(userClaimStatus.issuer.revocationTreeRoot),
      ).string(),
      issuerClaimNonRevRootsTreeRoot: newHashFromHex(
        String(userClaimStatus.issuer.rootOfRoots),
      ).string(),
      issuerClaimNonRevState: newHashFromHex(
        String(userClaimStatus.issuer.state),
      ).string(),

      /* issuerClaim signature */
      issuerClaimSignatureR8x: signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y: signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS: signatureProof.signature.S.toString(),

      /* current time */
      timestamp,

      /* Query */
      claimSchema: claim.getSchemaHash().bigInt().toString(),

      claimPathNotExists: '0',
      claimPathMtp: ensureArraySize(
        claimProof.proof.siblings.map((el) => el.string()),
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: '0',
      claimPathMtpAuxHi: '0',
      claimPathMtpAuxHv: '0',
      claimPathKey: (await path.mtEntry()).toString(),
      claimPathValue: claimProof.value?.value,

      slotIndex: '0',
      operator: '1',
      value,
    });
  }

  async #createCoreClaimFromIssuer(): Promise<{
    path: Path;
    coreClaim: Claim;
    claimProof: {
      proof: Proof;
      value?: MtValue;
    };
  }> {
    const schemaHash = await this.#getSchemaHash();

    const credential = { ...this.verifiableCredential };
    delete credential.proof;

    const mz = await Merklizer.merklizeJSONLD(JSON.stringify(credential));
    const path: Path = await mz.resolveDocPath(`credentialSubject.isNatural`);
    const claimProof = await mz.proof(path);

    claimProof.proof.siblings = circomSiblingsFromSiblings(
      claimProof.proof.siblings,
      defaultMTLevelsClaimsMerklization,
    );

    const coreClaim = Claim.newClaim(
      schemaHash,
      ClaimOptions.withValueMerklizedRoot((await mz.root()).bigInt()),
      ClaimOptions.withIndexId(this.identity.identityId),
      ClaimOptions.withRevocationNonce(
        BigInt(this.verifiableCredential.credentialStatus.revocationNonce!),
      ),
    );

    return { path, coreClaim, claimProof };
  }

  async #getSchemaHash(): Promise<SchemaHash> {
    const response = await fetch(this.verifiableCredential.credentialSchema.id);
    const data = await response.json();
    const schemaString = `${data?.$metadata.uris.jsonLdContext}#${this.verifiableCredential.credentialSubject.type}`;
    const schemaBytes = new TextEncoder().encode(schemaString);
    const keccakString = arrayify(keccak256(Buffer.from(schemaBytes)));
    return new SchemaHash(keccakString.subarray(keccakString.byteLength - 16));
  }

  async #requestClaimRevocationStatus(revNonce: number) {
    const response = await fetch(
      `http://127.0.0.1:8000/integrations/issuer/v1/public/claims/revocations/check/${revNonce}`,
    );

    const data = await response.json();

    return data as ClaimStatus;
  }

  #parseBJJSignatureProof() {
    const [credentialSigProof] = this.verifiableCredential.proof!;

    const issuerData = credentialSigProof.issuerData.state;

    const claimsTreeRoot = newHashFromHex(String(issuerData.claimsTreeRoot));
    const revocationTreeRoot = newHashFromHex(
      String(issuerData.revocationTreeRoot),
    );
    const rootOfRoots = newHashFromHex(String(issuerData.rootOfRoots));

    const state = hashElems([
      claimsTreeRoot.bigInt(),
      revocationTreeRoot.bigInt(),
      rootOfRoots.bigInt(),
    ]);

    const issuerState: IssuerState = {
      claimsTreeRoot,
      revocationTreeRoot,
      rootOfRoots,
      state,
    };
    const decodedSignature = Hex.decodeString(credentialSigProof.signature);
    const signature = Signature.newFromCompressed(decodedSignature);

    const issuerAuthClaimIncProof = ensureArraySize(
      [...credentialSigProof.issuerData.mtp.siblings],
      defaultMTLevels,
    );

    return {
      claimsTreeRoot,
      revocationTreeRoot,
      rootOfRoots,
      issuerState,

      signature,

      issuerAuthClaim: unmarshalBinary(
        Hex.decodeString(credentialSigProof.issuerData.authCoreClaim),
      ),
      issuerAuthClaimIncProof,
    };
  }
}
