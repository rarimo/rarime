import { Hex } from '@iden3/js-crypto';
import { fromLittleEndian } from '@iden3/js-iden3-core';

import { proving, type ZKProof } from '@iden3/js-jwz';
import { newHashFromHex } from '@iden3/js-merkletree';

import { type Identity } from './identity';

import {
  getGISTProof,
  getPreparedCredential,
  newCircuitClaimData,
  prepareCircuitArrayValues,
  prepareSiblingsStr,
  readBytesFile,
  toCircuitsQuery,
} from './helpers';
import type { CreateProofRequest, W3CCredential } from './types';
import { config } from './config';
import {
  defaultMTLevels,
  defaultMTLevelsClaimsMerklization,
  defaultMTLevelsOnChain,
  defaultValueArraySize,
} from './const';
import { CircuitId } from './enums';

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

  proofRequest: CreateProofRequest = {} as CreateProofRequest;

  constructor(
    identity: Identity,
    proofRequest: CreateProofRequest,
    verifiableCredential: W3CCredential,
  ) {
    this.identity = identity;
    this.verifiableCredential = verifiableCredential;
    this.proofRequest = proofRequest;
  }

  async generateProof() {
    const inputs = await this.generateInputs();

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

  async generateInputs(): Promise<string> {
    let generateInputFn;
    switch (this.proofRequest.circuitId) {
      case CircuitId.AtomicQuerySigV2OnChain:
        generateInputFn = this.generateQuerySigV2OnChainInputs.bind(this);
        break;
      default:
        throw new Error(
          `circuit with id ${this.proofRequest.circuitId} is not supported by issuer`,
        );
    }

    return generateInputFn();
  }

  async generateQuerySigV2OnChainInputs() {
    const preparedCredential = await getPreparedCredential(
      this.verifiableCredential,
    );

    const circuitClaimData = await newCircuitClaimData(
      preparedCredential.credential,
      preparedCredential.credentialCoreClaim,
    );

    const query = await toCircuitsQuery(
      this.proofRequest.query,
      preparedCredential.credential,
      preparedCredential.credentialCoreClaim,
    );

    const nonRevProof = {
      proof: preparedCredential.revStatus.mtp,
      treeState: {
        state: newHashFromHex(preparedCredential.revStatus.issuer.state!),
        claimsRoot: newHashFromHex(
          preparedCredential.revStatus.issuer.claimsTreeRoot!,
        ),
        revocationRoot: newHashFromHex(
          preparedCredential.revStatus.issuer.revocationTreeRoot!,
        ),
        rootOfRoots: newHashFromHex(
          preparedCredential.revStatus.issuer.rootOfRoots!,
        ),
      },
    };

    const gistInfo = await getGISTProof({
      rpcUrl: config.RPC_URL,
      contractAddress: config.STATE_V2_ADDRESS,
      userId: this.identity.identityIdBigIntString,
    });

    const challenge = fromLittleEndian(
      Hex.decodeString(this.proofRequest.challenge || '0n'),
    );

    const signatureChallenge = this.identity.privateKey.signPoseidon(challenge);

    console.log(preparedCredential);

    const timestamp = Math.floor(Date.now() / 1000);

    const value = prepareCircuitArrayValues(
      query.values,
      defaultValueArraySize,
    ).map((a) => a.toString());

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      /* userID ownership signals */
      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      /* user state */
      userState: this.identity.treeState.state,
      userClaimsTreeRoot: this.identity.treeState.claimsRoot,
      userRevTreeRoot: this.identity.treeState.revocationRoot,
      userRootsTreeRoot: this.identity.treeState.rootOfRoots,

      /* Auth claim */
      authClaim: this.identity.coreAuthClaim.marshalJson(), // TODO check

      /* auth claim. merkle tree proof of inclusion to claim tree */
      authClaimIncMtp: this.identity.authClaimIncProofSiblings,

      /* auth claim - rev nonce. merkle tree proof of non-inclusion to rev tree */
      authClaimNonRevMtp: this.identity.authClaimNonRevProofSiblings,
      authClaimNonRevMtpNoAux: '1', // TODO
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
      ), // TODO
      gistMtpAuxHi: gistInfo?.auxIndex.toString(),
      gistMtpAuxHv: gistInfo?.auxValue.toString(),
      gistMtpNoAux: gistInfo?.auxExistence ? '0' : '1',

      /* issuerClaim signals */
      claimSubjectProfileNonce: '0',

      /* issuer ID */
      issuerID: circuitClaimData.issuerId.bigInt().toString(),

      /* issuer auth proof of existence */
      issuerAuthClaim:
        circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot
          .bigInt()
          .toString(),
      issuerAuthRevTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot
          .bigInt()
          .toString(),
      issuerAuthRootsTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots
          .bigInt()
          .toString(),

      /* issuer auth claim non rev proof */
      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: '1', // TODO
      issuerAuthClaimNonRevMtpAuxHi: '0',
      issuerAuthClaimNonRevMtpAuxHv: '0',

      /* claim issued by issuer to the user */
      issuerClaim: circuitClaimData.claim.marshalJson(),
      /* issuerClaim non rev inputs */
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        nonRevProof.proof,
        defaultMTLevels,
      ),
      // TODO
      issuerClaimNonRevMtpNoAux:
        Boolean(nonRevProof.proof.nodeAux?.key) &&
        Boolean(nonRevProof.proof.nodeAux?.value)
          ? 0
          : 1,
      issuerClaimNonRevMtpAuxHi: nonRevProof.proof.nodeAux?.key ?? 0,
      issuerClaimNonRevMtpAuxHv: nonRevProof.proof.nodeAux?.value ?? 0,
      issuerClaimNonRevClaimsTreeRoot: nonRevProof.treeState.claimsRoot
        .bigInt()
        .toString(),
      issuerClaimNonRevRevTreeRoot: nonRevProof.treeState.revocationRoot
        .bigInt()
        .toString(),
      issuerClaimNonRevRootsTreeRoot: nonRevProof.treeState.rootOfRoots
        .bigInt()
        .toString(),
      issuerClaimNonRevState: nonRevProof.treeState.state.bigInt().toString(),

      /* issuerClaim signature */
      issuerClaimSignatureR8x:
        circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        circuitClaimData.signatureProof.signature.S.toString(),

      /* current time */
      timestamp,

      /* Query */
      claimSchema: circuitClaimData.claim.getSchemaHash().bigInt().toString(),

      claimPathNotExists: query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: '0', // TODO
      claimPathMtpAuxHi: '0',
      claimPathMtpAuxHv: '0',
      claimPathKey: query.valueProof?.path.toString(),
      claimPathValue: query.valueProof?.value?.toString(),

      slotIndex: query.slotIndex,
      operator: query.operator,
      value,
    });
  }
}
