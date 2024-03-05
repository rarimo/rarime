import { proving, ZKProof } from '@iden3/js-jwz';

import { Hex, Signature } from '@iden3/js-crypto';
import { fromLittleEndian } from '@iden3/js-iden3-core';
import { CircuitId, CreateProofRequest } from '@rarimo/rarime-connector';

import {
  buildTreeState,
  CircuitClaim,
  getGISTProof,
  getNodeAuxValue,
  getPreparedCredential,
  getProviderChainInfo,
  getRarimoEvmRpcUrl,
  getRarimoStateContractAddress,
  getFileBytes,
  newCircuitClaimData,
  prepareCircuitArrayValues,
  prepareSiblingsStr,
  Query,
  toCircuitsQuery,
  toGISTProof,
} from '@/zkp/helpers';
import { Identity } from '@/zkp/identity';
import type {
  ClaimNonRevStatus,
  GISTProof,
  NodeAuxValue,
  W3CCredential,
} from '@/zkp/types';
import {
  defaultMTLevels,
  defaultMTLevelsClaimsMerklization,
  defaultMTLevelsOnChain,
  defaultValueArraySize,
} from '@/zkp/const';
import { config } from '@/config';

export class ZkpGen {
  identity: Identity = {} as Identity;

  verifiableCredential: W3CCredential = {} as W3CCredential;

  subjectProof: ZKProof = {} as ZKProof;

  proofRequest: CreateProofRequest = {} as CreateProofRequest;

  circuitClaimData: CircuitClaim = {} as CircuitClaim;

  query: Query = {} as Query;

  nodeAuxIssuerAuthNonRev: NodeAuxValue = {} as NodeAuxValue;

  nodeAuxNonRev: NodeAuxValue = {} as NodeAuxValue;

  nodAuxJSONLD: NodeAuxValue = {} as NodeAuxValue;

  nonRevProof: ClaimNonRevStatus = {} as ClaimNonRevStatus;

  value: string[] = [];

  timestamp?: number;

  gistProof?: GISTProof;

  challenge?: bigint;

  signatureChallenge?: Signature;

  globalNodeAux?: NodeAuxValue;

  nodeAuxAuth?: NodeAuxValue;

  constructor(
    identity: Identity,
    proofRequest: CreateProofRequest,
    verifiableCredential: W3CCredential,
  ) {
    this.identity = identity;
    this.verifiableCredential = verifiableCredential;
    this.proofRequest = proofRequest;
  }

  async generateProof(coreStateHash: string, operationGistHash: string) {
    const preparedCredential = await getPreparedCredential(
      this.verifiableCredential,
    );

    this.circuitClaimData = await newCircuitClaimData(
      preparedCredential.credential,
      preparedCredential.credentialCoreClaim,
      coreStateHash,
    );

    this.query = await toCircuitsQuery(
      this.proofRequest.query,
      preparedCredential.credential,
      preparedCredential.credentialCoreClaim,
    );

    this.nonRevProof = {
      proof: preparedCredential.revStatus.mtp,
      treeState: buildTreeState(
        preparedCredential.revStatus.issuer.state!,
        preparedCredential.revStatus.issuer.claimsTreeRoot!,
        preparedCredential.revStatus.issuer.revocationTreeRoot!,
        preparedCredential.revStatus.issuer.rootOfRoots!,
      ),
    };

    this.timestamp = Math.floor(Date.now() / 1000);

    this.nodeAuxIssuerAuthNonRev = getNodeAuxValue(
      this.circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
    );
    this.nodeAuxNonRev = getNodeAuxValue(this.nonRevProof.proof);
    this.nodAuxJSONLD = getNodeAuxValue(this.query.valueProof!.mtp);
    this.value = prepareCircuitArrayValues(
      this.query.values,
      defaultValueArraySize,
    ).map((a) => a.toString());

    if (
      this.proofRequest.circuitId === CircuitId.AtomicQuerySigV2OnChain ||
      this.proofRequest.circuitId === CircuitId.AtomicQueryMTPV2OnChain
    ) {
      const providerChainInfo = await getProviderChainInfo();

      const gistInfo = await getGISTProof({
        rpcUrl: getRarimoEvmRpcUrl(providerChainInfo.id),
        contractAddress: getRarimoStateContractAddress(providerChainInfo.id),
        userId: this.identity.identityIdBigIntString,
        rootHash: operationGistHash,
      });
      this.gistProof = toGISTProof(gistInfo);

      const challenge = fromLittleEndian(
        Hex.decodeString(this.proofRequest.accountAddress!.substring(2)),
      ).toString();
      this.challenge = BigInt(this.proofRequest.challenge ?? challenge);

      this.signatureChallenge = this.identity.privateKey.signPoseidon(
        this.challenge,
      );

      this.globalNodeAux = getNodeAuxValue(this.gistProof.proof);
      this.nodeAuxAuth = getNodeAuxValue(this.identity.authClaimNonRevProof);
    }

    const circuiInfo = this.getCircuitInfo();

    const [wasm, provingKey] = await Promise.all([
      getFileBytes(circuiInfo.wasm),
      getFileBytes(circuiInfo.finalKey),
    ]);
    this.subjectProof = await proving.provingMethodGroth16AuthV2Instance.prove(
      new TextEncoder().encode(circuiInfo.generateInputFn()),
      provingKey,
      wasm,
    );

    return this.subjectProof;
  }

  getCircuitInfo() {
    switch (this.proofRequest.circuitId) {
      case CircuitId.AtomicQuerySigV2OnChain:
        return {
          wasm: config.CIRCUIT_SIG_V2_ON_CHAIN_WASM_URL,
          finalKey: config.CIRCUIT_SIG_V2_ON_CHAIN_FINAL_KEY_URL,
          generateInputFn: this.generateQuerySigV2OnChainInputs.bind(this),
        };
      case CircuitId.AtomicQuerySigV2:
        return {
          wasm: config.CIRCUIT_SIG_V2_WASM_URL,
          finalKey: config.CIRCUIT_SIG_V2_FINAL_KEY_URL,
          generateInputFn: this.generateQuerySigV2Inputs.bind(this),
        };
      case CircuitId.AtomicQueryMTPV2:
        return {
          wasm: config.CIRCUIT_MTP_V2_WASM_URL,
          finalKey: config.CIRCUIT_MTP_V2_FINAL_KEY_URL,
          generateInputFn: this.generateQueryMTPV2Inputs.bind(this),
        };
      case CircuitId.AtomicQueryMTPV2OnChain:
        return {
          wasm: config.CIRCUIT_MTP_V2_ON_CHAIN_WASM_URL,
          finalKey: config.CIRCUIT_MTP_V2_ON_CHAIN_FINAL_KEY_URL,
          generateInputFn: this.generateQueryMTPV2OnChainInputs.bind(this),
        };
      default:
        throw new Error(
          `circuit with id ${this.proofRequest.circuitId} is not supported by issuer`,
        );
    }
  }

  generateQuerySigV2OnChainInputs() {
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
      authClaimNonRevMtpAuxHi: this.nodeAuxAuth?.key.string(),
      authClaimNonRevMtpAuxHv: this.nodeAuxAuth?.value.string(),
      authClaimNonRevMtpNoAux: this.nodeAuxAuth?.noAux,

      challenge: this.challenge?.toString(),
      challengeSignatureR8x: this.signatureChallenge?.R8[0].toString(),
      challengeSignatureR8y: this.signatureChallenge?.R8[1].toString(),
      challengeSignatureS: this.signatureChallenge?.S.toString(),

      gistRoot: this.gistProof?.root.string(),
      gistMtp: prepareSiblingsStr(
        this.gistProof!.proof,
        defaultMTLevelsOnChain,
      ),
      gistMtpAuxHi: this.globalNodeAux?.key.string(),
      gistMtpAuxHv: this.globalNodeAux?.value.string(),
      gistMtpNoAux: this.globalNodeAux?.noAux,

      claimSubjectProfileNonce: '0',

      issuerID: this.circuitClaimData.issuerId.bigInt().toString(),

      issuerAuthClaim: this.circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot: this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot.string(),
      issuerAuthRevTreeRoot: this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot.string(),
      issuerAuthRootsTreeRoot: this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: this.nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: this.nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv: this.nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: this.circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: this.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: this.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot: this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot: this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot: this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimSignatureR8x: this.circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y: this.circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS: this.circuitClaimData.signatureProof.signature.S.toString(),

      timestamp: this.timestamp,

      claimSchema: this.circuitClaimData.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        this.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.nodAuxJSONLD.value.string(),
      claimPathKey: this.query.valueProof?.path.toString(),
      claimPathValue: this.query.valueProof?.value?.toString(),

      slotIndex: this.query.slotIndex,
      operator: this.query.operator,
      value: this.value,
    });
  }

  generateQuerySigV2Inputs() {
    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      claimSubjectProfileNonce: '0',

      issuerID: this.circuitClaimData.issuerId.bigInt().toString(),

      issuerAuthClaim: this.circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot: this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot.string(),
      issuerAuthRevTreeRoot: this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot.string(),
      issuerAuthRootsTreeRoot: this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: this.nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: this.nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv: this.nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: this.circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: this.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: this.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot: this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot: this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot: this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimSignatureR8x: this.circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y: this.circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS: this.circuitClaimData.signatureProof.signature.S.toString(),

      timestamp: this.timestamp,

      claimSchema: this.circuitClaimData.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        this.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.nodAuxJSONLD.value.string(),
      claimPathKey: this.query.valueProof?.path.toString(),
      claimPathValue: this.query.valueProof?.value?.toString(),

      slotIndex: this.query.slotIndex,
      operator: this.query.operator,
      value: this.value,
    });
  }

  generateQueryMTPV2Inputs() {
    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      claimSubjectProfileNonce: '0',

      issuerID: this.circuitClaimData.issuerId.bigInt().toString(),

      issuerClaim: this.circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: this.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: this.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot: this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot: this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot: this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot: this.circuitClaimData.incProof.treeState?.claimsRoot.string(),
      issuerClaimRevTreeRoot: this.circuitClaimData.incProof.treeState?.revocationRoot.string(),
      issuerClaimRootsTreeRoot: this.circuitClaimData.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState: this.circuitClaimData.incProof.treeState?.state.string(),

      timestamp: this.timestamp,

      claimSchema: this.circuitClaimData.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        this.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.nodAuxJSONLD.value.string(),
      claimPathKey: this.query.valueProof?.path.toString(),
      claimPathValue: this.query.valueProof?.value?.toString(),

      slotIndex: this.query.slotIndex,
      operator: this.query.operator,
      value: this.value,
    });
  }

  generateQueryMTPV2OnChainInputs() {
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
      authClaimNonRevMtpAuxHi: this.nodeAuxAuth?.key.string(),
      authClaimNonRevMtpAuxHv: this.nodeAuxAuth?.value.string(),
      authClaimNonRevMtpNoAux: this.nodeAuxAuth?.noAux,

      challenge: this.challenge?.toString(),
      challengeSignatureR8x: this.signatureChallenge?.R8[0].toString(),
      challengeSignatureR8y: this.signatureChallenge?.R8[1].toString(),
      challengeSignatureS: this.signatureChallenge?.S.toString(),

      gistRoot: this.gistProof?.root.string(),
      gistMtp: prepareSiblingsStr(
        this.gistProof!.proof,
        defaultMTLevelsOnChain,
      ),
      gistMtpAuxHi: this.globalNodeAux?.key.string(),
      gistMtpAuxHv: this.globalNodeAux?.value.string(),
      gistMtpNoAux: this.globalNodeAux?.noAux,

      claimSubjectProfileNonce: '0',

      issuerID: this.circuitClaimData.issuerId.bigInt().toString(),

      issuerClaim: this.circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: this.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: this.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot: this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot: this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot: this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot: this.circuitClaimData.incProof.treeState?.claimsRoot.string(),
      issuerClaimRevTreeRoot: this.circuitClaimData.incProof.treeState?.revocationRoot.string(),
      issuerClaimRootsTreeRoot: this.circuitClaimData.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState: this.circuitClaimData.incProof.treeState?.state.string(),

      timestamp: this.timestamp,

      claimSchema: this.circuitClaimData.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.query.valueProof?.mtp.existence ? 0 : 1,
      claimPathMtp: prepareSiblingsStr(
        this.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.nodAuxJSONLD.value.string(),
      claimPathKey: this.query.valueProof?.path.toString(),
      claimPathValue: this.query.valueProof?.value?.toString(),

      slotIndex: this.query.slotIndex,
      operator: this.query.operator,
      value: this.value,
    });
  }
}
