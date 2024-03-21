import type { Signature } from '@iden3/js-crypto';
import { Hex } from '@iden3/js-crypto';
import { fromLittleEndian } from '@iden3/js-iden3-core';
import type { ZKProof } from '@iden3/js-jwz';
import { proving } from '@iden3/js-jwz';
import type {
  ChainZkpInfo,
  CreateProofRequest,
} from '@rarimo/rarime-connector';
import { CircuitId, getGISTProof } from '@rarimo/rarime-connector';

import {
  defaultMTLevels,
  defaultMTLevelsClaimsMerklization,
  defaultMTLevelsOnChain,
  defaultValueArraySize,
} from '@/const';
import {
  getFileBytes,
  getNodeAuxValue,
  checkVCAndGetCoreClaim,
  formatRawClaimToCircuitClaim,
  prepareCircuitArrayValues,
  prepareSiblingsStr,
  toCircuitsQuery,
  toGISTProof,
} from '@/helpers';
import type { Identity } from '@/instances/identity';
import type {
  CircuitClaim,
  RevocationStatus,
  GISTProof,
  NodeAuxValue,
  W3CCredential,
  Query,
} from '@/types';

type Config = {
  loadingCircuitCb?: (path: string) => Promise<Uint8Array>;
  chainInfo: ChainZkpInfo;
  circuitsUrls: Record<CircuitId, { wasmUrl: string; keyUrl: string }>;
};

type CommonInputsDetails = {
  circuitClaim: CircuitClaim;
  query: Query;
  nodeAuxNonRev: NodeAuxValue;
  nodAuxJSONLD: NodeAuxValue;
  claimNonRevStatus: RevocationStatus;
  value: string[];
  timestamp?: number;
};

type OnChainInputDetails = {
  gistProof: GISTProof;
  challenge: bigint;
  signatureChallenge: Signature;
  globalNodeAux: NodeAuxValue;
  nodeAuxAuth: NodeAuxValue;
};

export class ZkpGen {
  config: Config;

  identity: Identity;

  verifiableCredential: W3CCredential;

  subjectProof?: ZKProof;

  proofRequest: CreateProofRequest;

  commonInputsDetails?: CommonInputsDetails;

  constructor(
    identity: Identity,
    proofRequest: CreateProofRequest,
    verifiableCredential: W3CCredential,
    config: Config,
  ) {
    this.identity = identity;
    this.verifiableCredential = verifiableCredential;
    this.proofRequest = proofRequest;
    this.config = config;
  }

  async generateProof(
    coreStateHash: string,
    operationGistHash: string,
  ): Promise<ZKProof> {
    // first thing first we need to get sig coreClaim and MTP coreClaim,
    // because coreClaim - is a set of data, where user's details is encoded,
    // and we proof exactly this data
    const { revStatus, coreClaim } = await checkVCAndGetCoreClaim(
      this.verifiableCredential,
      this.proofRequest.circuitId,
    );

    // Now, based on query, provided by requestor, we need to ensure,
    // that it is valid according to scheme in verifiable credential
    const query = await toCircuitsQuery(
      this.proofRequest.query,
      this.verifiableCredential,
      coreClaim,
    );

    this.commonInputsDetails = {
      // If we here, that means claim's revocation nonce is not in the revocation tree,
      // it could be named as "non revocation proof" (nonRevProof, ...etc)
      // We need it to populate inputs later, so let's save it
      claimNonRevStatus: revStatus,

      // After defining core claim, we need to format it in a way,
      // that it can be used in the circuit, e. g. to @iden3 libs understand it
      circuitClaim: await formatRawClaimToCircuitClaim(
        this.verifiableCredential,
        coreClaim,
        coreStateHash,
      ),

      // Now, based on query, provided by requestor, we need to ensure,
      // that it is valid according to scheme in verifiable credential
      query,

      nodeAuxNonRev: getNodeAuxValue(revStatus.mtp),
      nodAuxJSONLD: getNodeAuxValue(query.valueProof!.mtp),

      timestamp: Math.floor(Date.now() / 1000),

      // after we prepared query, here will be a list of values,
      // which we need to prove later
      value: prepareCircuitArrayValues(query.values, defaultValueArraySize).map(
        (a) => a.toString(),
      ),
    };

    const circuitWasmUrl =
      this.config.circuitsUrls[this.proofRequest.circuitId].wasmUrl;
    const circuitKeyUrl =
      this.config.circuitsUrls[this.proofRequest.circuitId].keyUrl;

    // get circuit files for proof generating
    const [wasm, provingKey] = await Promise.all([
      getFileBytes(circuitWasmUrl, this.config.loadingCircuitCb),
      getFileBytes(circuitKeyUrl, this.config.loadingCircuitCb),
    ]);

    // generate inputs according to circuit id
    const getInputs = {
      [CircuitId.AtomicQueryMTPV2]: async () => this.generateQueryMTPV2Inputs(),
      [CircuitId.AtomicQueryMTPV2OnChain]: async () =>
        this.generateQueryMTPV2OnChainInputs(operationGistHash),
      [CircuitId.AtomicQuerySigV2]: async () => this.generateQuerySigV2Inputs(),
      [CircuitId.AtomicQuerySigV2OnChain]: async () =>
        this.generateQuerySigV2OnChainInputs(operationGistHash),
    }[this.proofRequest.circuitId];

    // generate proof
    this.subjectProof = await proving.provingMethodGroth16AuthV2Instance.prove(
      new TextEncoder().encode(await getInputs()),
      provingKey,
      wasm,
    );

    return this.subjectProof;
  }

  // https://github.com/iden3/go-circuits/blob/main/credentialAtomicQuerySigV2OnChain.go#L48
  async generateQuerySigV2OnChainInputs(operationGistHash: string) {
    console.log('generateQuerySigV2OnChainInputs');
    if (!this.commonInputsDetails) {
      throw new TypeError('commonInputsDetails is not defined');
    }

    if (!this.commonInputsDetails.circuitClaim.signatureProof) {
      throw new TypeError('circuitClaimData.signatureProof is not defined');
    }

    // preparedCredential.revStatus - says,
    // that claim's revocation nonce is not in the revocation tree.
    // And we need to prepare aux data, to prove it
    // these aux variables also need to populate inputs later
    const nodeAuxIssuerAuthNonRev = getNodeAuxValue(
      this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthNonRevProof
        .proof,
    );

    const onChainInputDetails = await this._getOnChainInputDetails(
      operationGistHash,
    );

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
      authClaimNonRevMtpAuxHi: onChainInputDetails.nodeAuxAuth?.key.string(),
      authClaimNonRevMtpAuxHv: onChainInputDetails.nodeAuxAuth?.value.string(),
      authClaimNonRevMtpNoAux: onChainInputDetails.nodeAuxAuth?.noAux,

      challenge: onChainInputDetails.challenge?.toString(),
      challengeSignatureR8x:
        onChainInputDetails.signatureChallenge?.R8[0].toString(),
      challengeSignatureR8y:
        onChainInputDetails.signatureChallenge?.R8[1].toString(),
      challengeSignatureS: onChainInputDetails.signatureChallenge?.S.toString(),

      gistRoot: onChainInputDetails.gistProof?.root.string(),
      gistMtp: prepareSiblingsStr(
        onChainInputDetails.gistProof!.proof,
        defaultMTLevelsOnChain,
      ),
      gistMtpAuxHi: onChainInputDetails.globalNodeAux?.key.string(),
      gistMtpAuxHv: onChainInputDetails.globalNodeAux?.value.string(),
      gistMtpNoAux: onChainInputDetails.globalNodeAux?.noAux,

      claimSubjectProfileNonce: '0',

      issuerID: this.commonInputsDetails.circuitClaim.issuerId
        .bigInt()
        .toString(),

      issuerAuthClaim:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof
          .proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof.treeState?.claimsTreeRoot.string(),
      issuerAuthRevTreeRoot:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof.treeState?.revocationTreeRoot.string(),
      issuerAuthRootsTreeRoot:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        this.commonInputsDetails.circuitClaim.signatureProof
          .issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv: nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: this.commonInputsDetails.circuitClaim.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.commonInputsDetails.claimNonRevStatus.mtp,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.commonInputsDetails.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi:
        this.commonInputsDetails.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv:
        this.commonInputsDetails.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.claimsTreeRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.revocationTreeRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.rootOfRoots.string(),
      issuerClaimNonRevState:
        this.commonInputsDetails.claimNonRevStatus.issuer.state.string(),

      issuerClaimSignatureR8x:
        this.commonInputsDetails.circuitClaim.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        this.commonInputsDetails.circuitClaim.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        this.commonInputsDetails.circuitClaim.signatureProof.signature.S.toString(),

      timestamp: this.commonInputsDetails.timestamp,

      claimSchema: this.commonInputsDetails.circuitClaim.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.commonInputsDetails.query.valueProof?.mtp
        .existence
        ? 0
        : 1,
      claimPathMtp: prepareSiblingsStr(
        this.commonInputsDetails.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.commonInputsDetails.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.commonInputsDetails.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.commonInputsDetails.nodAuxJSONLD.value.string(),
      claimPathKey: this.commonInputsDetails.query.valueProof?.path.toString(),
      claimPathValue:
        this.commonInputsDetails.query.valueProof?.value?.toString(),

      slotIndex: this.commonInputsDetails.query.slotIndex,
      operator: this.commonInputsDetails.query.operator,
      value: this.commonInputsDetails.value,
    });
  }

  // https://github.com/iden3/go-circuits/blob/main/credentialAtomicQuerySigV2.go#L35
  async generateQuerySigV2Inputs() {
    console.log('generateQuerySigV2Inputs');
    if (!this.commonInputsDetails) {
      throw new TypeError('commonInputsDetails is not defined');
    }

    if (!this.commonInputsDetails.circuitClaim.signatureProof) {
      throw new TypeError('circuitClaimData.signatureProof is not defined');
    }

    // preparedCredential.revStatus - says, that proof is not a part of revocation tree
    // and we need to prepare aux data, to prove it
    // these aux variables also need to populate inputs later
    const nodeAuxIssuerAuthNonRev = getNodeAuxValue(
      this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthNonRevProof
        .proof,
    );

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      claimSubjectProfileNonce: '0',

      issuerID: this.commonInputsDetails.circuitClaim.issuerId
        .bigInt()
        .toString(),

      issuerAuthClaim:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof
          .proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof.treeState?.claimsTreeRoot.string(),
      issuerAuthRevTreeRoot:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof.treeState?.revocationTreeRoot.string(),
      issuerAuthRootsTreeRoot:
        this.commonInputsDetails.circuitClaim.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        this.commonInputsDetails.circuitClaim.signatureProof
          .issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv: nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: this.commonInputsDetails.circuitClaim.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.commonInputsDetails.claimNonRevStatus.mtp,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.commonInputsDetails.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi:
        this.commonInputsDetails.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv:
        this.commonInputsDetails.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.claimsTreeRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.revocationTreeRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.rootOfRoots.string(),
      issuerClaimNonRevState:
        this.commonInputsDetails.claimNonRevStatus.issuer.state.string(),

      issuerClaimSignatureR8x:
        this.commonInputsDetails.circuitClaim.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        this.commonInputsDetails.circuitClaim.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        this.commonInputsDetails.circuitClaim.signatureProof.signature.S.toString(),

      timestamp: this.commonInputsDetails.timestamp,

      claimSchema: this.commonInputsDetails.circuitClaim.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.commonInputsDetails.query.valueProof?.mtp
        .existence
        ? 0
        : 1,
      claimPathMtp: prepareSiblingsStr(
        this.commonInputsDetails.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.commonInputsDetails.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.commonInputsDetails.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.commonInputsDetails.nodAuxJSONLD.value.string(),
      claimPathKey: this.commonInputsDetails.query.valueProof?.path.toString(),
      claimPathValue:
        this.commonInputsDetails.query.valueProof?.value?.toString(),

      slotIndex: this.commonInputsDetails.query.slotIndex,
      operator: this.commonInputsDetails.query.operator,
      value: this.commonInputsDetails.value,
    });
  }

  // https://github.com/iden3/go-circuits/blob/main/credentialAtomicQueryMTPV2.go#L34
  async generateQueryMTPV2Inputs() {
    console.log('generateQueryMTPV2Inputs');
    if (!this.commonInputsDetails) {
      throw new TypeError('commonInputsDetails is not defined');
    }

    if (!this.commonInputsDetails.circuitClaim.incProof) {
      throw new TypeError('circuitClaimData.incProof is not defined');
    }

    return JSON.stringify({
      /* we have no constraints for "requestID" in this circuit, it is used as a unique identifier for the request */
      /* and verifier can use it to identify the request, and verify the proof of specific request in case of multiple query requests */
      requestID: this.proofRequest.id?.toString || '1',

      userGenesisID: this.identity.identityIdBigIntString,
      profileNonce: '0',

      claimSubjectProfileNonce: '0',

      issuerID: this.commonInputsDetails.circuitClaim.issuerId
        .bigInt()
        .toString(),

      issuerClaim: this.commonInputsDetails.circuitClaim.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.commonInputsDetails.claimNonRevStatus.mtp,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.commonInputsDetails.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi:
        this.commonInputsDetails.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv:
        this.commonInputsDetails.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.claimsTreeRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.revocationTreeRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.rootOfRoots.string(),
      issuerClaimNonRevState:
        this.commonInputsDetails.claimNonRevStatus.issuer.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        this.commonInputsDetails.circuitClaim.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.claimsTreeRoot.string(),
      issuerClaimRevTreeRoot:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.revocationTreeRoot.string(),
      issuerClaimRootsTreeRoot:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.state.string(),

      timestamp: this.commonInputsDetails.timestamp,

      claimSchema: this.commonInputsDetails.circuitClaim.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.commonInputsDetails.query.valueProof?.mtp
        .existence
        ? 0
        : 1,
      claimPathMtp: prepareSiblingsStr(
        this.commonInputsDetails.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.commonInputsDetails.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.commonInputsDetails.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.commonInputsDetails.nodAuxJSONLD.value.string(),
      claimPathKey: this.commonInputsDetails.query.valueProof?.path.toString(),
      claimPathValue:
        this.commonInputsDetails.query.valueProof?.value?.toString(),

      slotIndex: this.commonInputsDetails.query.slotIndex,
      operator: this.commonInputsDetails.query.operator,
      value: this.commonInputsDetails.value,
    });
  }

  // https://github.com/iden3/go-circuits/blob/main/credentialAtomicQueryMTPV2OnChain.go#L46
  async generateQueryMTPV2OnChainInputs(operationGistHash: string) {
    console.log('generateQueryMTPV2OnChainInputs');
    if (!this.commonInputsDetails) {
      throw new TypeError('commonInputsDetails is not defined');
    }

    if (!this.commonInputsDetails.circuitClaim.incProof) {
      throw new TypeError('circuitClaimData.incProof is not defined');
    }

    const onChainInputDetails = await this._getOnChainInputDetails(
      operationGistHash,
    );

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
      authClaimNonRevMtpAuxHi: onChainInputDetails.nodeAuxAuth?.key.string(),
      authClaimNonRevMtpAuxHv: onChainInputDetails.nodeAuxAuth?.value.string(),
      authClaimNonRevMtpNoAux: onChainInputDetails.nodeAuxAuth?.noAux,

      challenge: onChainInputDetails.challenge?.toString(),
      challengeSignatureR8x:
        onChainInputDetails.signatureChallenge?.R8[0].toString(),
      challengeSignatureR8y:
        onChainInputDetails.signatureChallenge?.R8[1].toString(),
      challengeSignatureS: onChainInputDetails.signatureChallenge?.S.toString(),

      gistRoot: onChainInputDetails.gistProof?.root.string(),
      gistMtp: prepareSiblingsStr(
        onChainInputDetails.gistProof!.proof,
        defaultMTLevelsOnChain,
      ),
      gistMtpAuxHi: onChainInputDetails.globalNodeAux?.key.string(),
      gistMtpAuxHv: onChainInputDetails.globalNodeAux?.value.string(),
      gistMtpNoAux: onChainInputDetails.globalNodeAux?.noAux,

      claimSubjectProfileNonce: '0',

      issuerID: this.commonInputsDetails.circuitClaim.issuerId
        .bigInt()
        .toString(),

      issuerClaim: this.commonInputsDetails.circuitClaim.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.commonInputsDetails.claimNonRevStatus.mtp,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.commonInputsDetails.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi:
        this.commonInputsDetails.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv:
        this.commonInputsDetails.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.claimsTreeRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.revocationTreeRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.commonInputsDetails.claimNonRevStatus.issuer.rootOfRoots.string(),
      issuerClaimNonRevState:
        this.commonInputsDetails.claimNonRevStatus.issuer.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        this.commonInputsDetails.circuitClaim.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.claimsTreeRoot.string(),
      issuerClaimRevTreeRoot:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.revocationTreeRoot.string(),
      issuerClaimRootsTreeRoot:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState:
        this.commonInputsDetails.circuitClaim.incProof.treeState?.state.string(),

      timestamp: this.commonInputsDetails.timestamp,

      claimSchema: this.commonInputsDetails.circuitClaim.claim
        .getSchemaHash()
        .bigInt()
        .toString(),
      claimPathNotExists: this.commonInputsDetails.query.valueProof?.mtp
        .existence
        ? 0
        : 1,
      claimPathMtp: prepareSiblingsStr(
        this.commonInputsDetails.query.valueProof!.mtp,
        defaultMTLevelsClaimsMerklization,
      ),
      claimPathMtpNoAux: this.commonInputsDetails.nodAuxJSONLD.noAux,
      claimPathMtpAuxHi: this.commonInputsDetails.nodAuxJSONLD.key.string(),
      claimPathMtpAuxHv: this.commonInputsDetails.nodAuxJSONLD.value.string(),
      claimPathKey: this.commonInputsDetails.query.valueProof?.path.toString(),
      claimPathValue:
        this.commonInputsDetails.query.valueProof?.value?.toString(),

      slotIndex: this.commonInputsDetails.query.slotIndex,
      operator: this.commonInputsDetails.query.operator,
      value: this.commonInputsDetails.value,
    });
  }

  async _getOnChainInputDetails(
    operationGistHash: string,
  ): Promise<OnChainInputDetails> {
    // https://docs.iden3.io/protocol/spec/#identity-profiles-new
    // Get GIST details from core state contract,
    // it's necessary, because we replicate state in target network,
    // and proof should be matched in both state contracts
    const gistInfo = await getGISTProof({
      rpcUrl: this.config.chainInfo.rarimoEvmRpcApiUrl,
      contractAddress: this.config.chainInfo.rarimoStateContractAddress,
      userId: this.identity.identityIdBigIntString,
      rootHash: operationGistHash,
    });
    const gistProof = toGISTProof(gistInfo);

    // Used to verify that the provided proof belongs to the existing user session, e.g. account address
    const challenge = BigInt(
      this.proofRequest.challenge ??
        fromLittleEndian(
          Hex.decodeString(this.proofRequest.accountAddress!.substring(2)),
        ).toString(),
    );

    const signatureChallenge = this.identity.privateKey.signPoseidon(challenge);

    // Used to verify that issuer details exist in the global state
    const globalNodeAux = getNodeAuxValue(gistProof.proof);
    const nodeAuxAuth = getNodeAuxValue(this.identity.authClaimNonRevProof);

    return {
      gistProof,
      challenge,
      signatureChallenge,
      globalNodeAux,
      nodeAuxAuth,
    };
  }
}
