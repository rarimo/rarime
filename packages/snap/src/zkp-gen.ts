import { proving, type ZKProof } from '@iden3/js-jwz';
import { newHashFromHex } from '@iden3/js-merkletree';

import { type Identity } from './identity';

import {
  getGISTProof,
  getNodeAuxValue,
  getPreparedCredential,
  newCircuitClaimData,
  prepareCircuitArrayValues,
  prepareSiblingsStr,
  readBytesFile,
  toCircuitsQuery,
  toGISTProof,
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
    const files = this.getCircuitFiles();

    const [wasm, provingKey] = await Promise.all([
      readBytesFile(files.wasm),
      readBytesFile(files.finalKey),
    ]);
    this.subjectProof = await proving.provingMethodGroth16AuthV2Instance.prove(
      new TextEncoder().encode(inputs),
      provingKey,
      wasm,
    );

    return this.subjectProof;
  }

  getCircuitFiles() {
    switch (this.proofRequest.circuitId) {
      case CircuitId.AtomicQuerySigV2OnChain:
        return {
          wasm: config.CIRCUIT_SIG_V2_ON_CHAIN_WASM_URL,
          finalKey: config.CIRCUIT_SIG_V2_ON_CHAIN_FINAL_KEY_URL,
        };
      case CircuitId.AtomicQuerySigV2:
        return {
          wasm: config.CIRCUIT_SIG_V2_WASM_URL,
          finalKey: config.CIRCUIT_SIG_V2_FINAL_KEY_URL,
        };
      case CircuitId.AtomicQueryMTPV2:
        return {
          wasm: config.CIRCUIT_MTP_V2_WASM_URL,
          finalKey: config.CIRCUIT_MTP_V2_FINAL_KEY_URL,
        };
      case CircuitId.AtomicQueryMTPV2OnChain:
        return {
          wasm: config.CIRCUIT_MTP_V2_ON_CHAIN_WASM_URL,
          finalKey: config.CIRCUIT_MTP_V2_ON_CHAIN_FINAL_KEY_URL,
        };
      default:
        throw new Error(
          `circuit with id ${this.proofRequest.circuitId} is not supported by issuer`,
        );
    }
  }

  async generateInputs(): Promise<string> {
    let generateInputFn;
    switch (this.proofRequest.circuitId) {
      case CircuitId.AtomicQuerySigV2OnChain:
        generateInputFn = this.generateQuerySigV2OnChainInputs.bind(this);
        break;
      case CircuitId.AtomicQuerySigV2:
        generateInputFn = this.generateQuerySigV2Inputs.bind(this);
        break;
      case CircuitId.AtomicQueryMTPV2:
        generateInputFn = this.generateQueryMTPV2Inputs.bind(this);
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
    const gistProof = toGISTProof(gistInfo);

    const challenge = BigInt(
      this.proofRequest.challenge ?? (this.proofRequest.id || 1),
    );

    const signatureChallenge = this.identity.privateKey.signPoseidon(challenge);

    const timestamp = Math.floor(Date.now() / 1000);

    const nodeAuxIssuerAuthNonRev = getNodeAuxValue(
      circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
    );

    const nodeAuxNonRev = getNodeAuxValue(nonRevProof.proof);
    const nodAuxJSONLD = getNodeAuxValue(query.valueProof!.mtp);
    const globalNodeAux = getNodeAuxValue(gistProof.proof);
    const nodeAuxAuth = getNodeAuxValue(this.identity.authClaimNonRevProof);

    const value = prepareCircuitArrayValues(
      query.values,
      defaultValueArraySize,
    ).map((a) => a.toString());

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      userState: this.identity.treeState.state,
      userClaimsTreeRoot: this.identity.treeState.claimsRoot,
      userRevTreeRoot: this.identity.treeState.revocationRoot,
      userRootsTreeRoot: this.identity.treeState.rootOfRoots,

      authClaim: this.identity.coreAuthClaim.marshalJson(),

      authClaimIncMtp: this.identity.authClaimIncProofSiblings,

      authClaimNonRevMtp: prepareSiblingsStr(
        this.identity.authClaimNonRevProof,
        defaultMTLevels,
      ),
      authClaimNonRevMtpAuxHi: nodeAuxAuth.key.string(),
      authClaimNonRevMtpAuxHv: nodeAuxAuth.value.string(),
      authClaimNonRevMtpNoAux: nodeAuxAuth.noAux,

      challenge: challenge.toString(),
      challengeSignatureR8x: signatureChallenge!.R8[0].toString(),
      challengeSignatureR8y: signatureChallenge!.R8[1].toString(),
      challengeSignatureS: signatureChallenge!.S.toString(),

      gistRoot: gistProof.root.string(),
      gistMtp: prepareSiblingsStr(gistProof.proof, defaultMTLevelsOnChain),
      gistMtpAuxHi: globalNodeAux?.key.string(),
      gistMtpAuxHv: globalNodeAux?.value.string(),
      gistMtpNoAux: globalNodeAux.noAux,

      claimSubjectProfileNonce: '0',

      issuerID: circuitClaimData.issuerId.bigInt().toString(),

      issuerAuthClaim:
        circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot.string(),
      issuerAuthRevTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot.string(),
      issuerAuthRootsTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv: nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: nonRevProof.treeState.state.string(),

      issuerClaimSignatureR8x:
        circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        circuitClaimData.signatureProof.signature.S.toString(),

      timestamp,

      claimSchema: circuitClaimData.claim.getSchemaHash().bigInt().toString(),
      claimPathNotExists: query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: nodAuxJSONLD.value.string(),
      claimPathKey: query.valueProof?.path.toString(),
      claimPathValue: query.valueProof?.value?.toString(),

      slotIndex: this.proofRequest.slotIndex ?? query.slotIndex,
      operator: query.operator,
      value,
    });
  }

  async generateQuerySigV2Inputs() {
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

    const timestamp = Math.floor(Date.now() / 1000);

    const nodeAuxIssuerAuthNonRev = getNodeAuxValue(
      circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
    );

    const nodeAuxNonRev = getNodeAuxValue(nonRevProof.proof);
    const nodAuxJSONLD = getNodeAuxValue(query.valueProof!.mtp);

    const value = prepareCircuitArrayValues(
      query.values,
      defaultValueArraySize,
    ).map((a) => a.toString());

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      claimSubjectProfileNonce: '0',

      issuerID: circuitClaimData.issuerId.bigInt().toString(),

      issuerAuthClaim:
        circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot.string(),
      issuerAuthRevTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot.string(),
      issuerAuthRootsTreeRoot:
        circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv: nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: nonRevProof.treeState.state.string(),

      issuerClaimSignatureR8x:
        circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        circuitClaimData.signatureProof.signature.S.toString(),

      timestamp,

      claimSchema: circuitClaimData.claim.getSchemaHash().bigInt().toString(),
      claimPathNotExists: query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: nodAuxJSONLD.value.string(),
      claimPathKey: query.valueProof?.path.toString(),
      claimPathValue: query.valueProof?.value?.toString(),

      slotIndex: this.proofRequest.slotIndex ?? query.slotIndex,
      operator: query.operator,
      value,
    });
  }

  async generateQueryMTPV2Inputs() {
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

    const timestamp = Math.floor(Date.now() / 1000);

    const nodeAuxNonRev = getNodeAuxValue(nonRevProof.proof);
    const nodAuxJSONLD = getNodeAuxValue(query.valueProof!.mtp);

    const value = prepareCircuitArrayValues(
      query.values,
      defaultValueArraySize,
    ).map((a) => a.toString());

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      claimSubjectProfileNonce: '0',

      issuerID: circuitClaimData.issuerId.bigInt().toString(),

      issuerClaim: circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: nonRevProof.treeState.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        circuitClaimData.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot:
        circuitClaimData.incProof.treeState?.claimsRoot.string(),
      issuerClaimRevTreeRoot:
        circuitClaimData.incProof.treeState?.revocationRoot.string(),
      issuerClaimRootsTreeRoot:
        circuitClaimData.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState: circuitClaimData.incProof.treeState?.state.string(),

      timestamp,

      claimSchema: circuitClaimData.claim.getSchemaHash().bigInt().toString(),
      claimPathNotExists: query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: nodAuxJSONLD.value.string(),
      claimPathKey: query.valueProof?.path.toString(),
      claimPathValue: query.valueProof?.value?.toString(),

      slotIndex: this.proofRequest.slotIndex ?? query.slotIndex,
      operator: query.operator,
      value,
    });
  }
}
