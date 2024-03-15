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
import { type Query } from '@/helpers';
import {
  buildTreeState,
  getFileBytes,
  getNodeAuxValue,
  getPreparedCredential,
  newCircuitClaimData,
  prepareCircuitArrayValues,
  prepareSiblingsStr,
  toCircuitsQuery,
  toGISTProof,
} from '@/helpers';
import type { Identity } from '@/instances/identity';
import type {
  CircuitClaim,
  ClaimNonRevStatus,
  GISTProof,
  NodeAuxValue,
  W3CCredential,
} from '@/types';

type Config = {
  loadingCircuitCb?: (path: string) => Promise<Uint8Array>;
  chainInfo: ChainZkpInfo;
  circuitsUrls: Record<CircuitId, { wasmUrl: string; keyUrl: string }>;
};

export class ZkpGen {
  config: Config;

  identity: Identity = {} as Identity;

  verifiableCredential: W3CCredential = {} as W3CCredential;

  subjectProof: ZKProof = {} as ZKProof;

  // used in inputs generation

  // common

  proofRequest: CreateProofRequest = {} as CreateProofRequest;

  circuitClaimData: CircuitClaim = {} as CircuitClaim;

  query: Query = {} as Query;

  nodeAuxNonRev: NodeAuxValue = {} as NodeAuxValue;

  nodAuxJSONLD: NodeAuxValue = {} as NodeAuxValue;

  nonRevProof: ClaimNonRevStatus = {} as ClaimNonRevStatus;

  value: string[] = [];

  timestamp?: number;

  // used in sig proofs only

  nodeAuxIssuerAuthNonRev: NodeAuxValue = {} as NodeAuxValue;

  // used on chain proofs only

  gistProof?: GISTProof;

  challenge?: bigint;

  signatureChallenge?: Signature;

  globalNodeAux?: NodeAuxValue;

  nodeAuxAuth?: NodeAuxValue;

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
      const gistInfo = await getGISTProof({
        rpcUrl: this.config.chainInfo.rarimoEvmRpcApiUrl,
        contractAddress: this.config.chainInfo.rarimoStateContractAddress,
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
      getFileBytes(circuiInfo.wasm, this.config.loadingCircuitCb),
      getFileBytes(circuiInfo.finalKey, this.config.loadingCircuitCb),
    ]);

    this.subjectProof = await proving.provingMethodGroth16AuthV2Instance.prove(
      new TextEncoder().encode(circuiInfo.generateInputFn()),
      provingKey,
      wasm,
    );

    return this.subjectProof;
  }

  getCircuitInfo() {
    const circuits = {
      [CircuitId.AtomicQuerySigV2OnChain]: {
        wasm: this.config.circuitsUrls[CircuitId.AtomicQuerySigV2OnChain]
          .wasmUrl,
        finalKey:
          this.config.circuitsUrls[CircuitId.AtomicQuerySigV2OnChain].keyUrl,
        generateInputFn: this.generateQuerySigV2OnChainInputs.bind(this),
      },
      [CircuitId.AtomicQuerySigV2]: {
        wasm: this.config.circuitsUrls[CircuitId.AtomicQuerySigV2].wasmUrl,
        finalKey: this.config.circuitsUrls[CircuitId.AtomicQuerySigV2].keyUrl,
        generateInputFn: this.generateQuerySigV2Inputs.bind(this),
      },
      [CircuitId.AtomicQueryMTPV2]: {
        wasm: this.config.circuitsUrls[CircuitId.AtomicQueryMTPV2].wasmUrl,
        finalKey: this.config.circuitsUrls[CircuitId.AtomicQueryMTPV2].keyUrl,
        generateInputFn: this.generateQueryMTPV2Inputs.bind(this),
      },
      [CircuitId.AtomicQueryMTPV2OnChain]: {
        wasm: this.config.circuitsUrls[CircuitId.AtomicQueryMTPV2OnChain]
          .wasmUrl,
        finalKey:
          this.config.circuitsUrls[CircuitId.AtomicQueryMTPV2OnChain].keyUrl,
        generateInputFn: this.generateQueryMTPV2OnChainInputs.bind(this),
      },
    }[this.proofRequest.circuitId];

    if (!circuits) {
      throw new Error(
        `circuit with id ${this.proofRequest.circuitId} is not supported by issuer`,
      );
    }

    return circuits;
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

      issuerAuthClaim:
        this.circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot.string(),
      issuerAuthRevTreeRoot:
        this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot.string(),
      issuerAuthRootsTreeRoot:
        this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: this.nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: this.nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv:
        this.nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: this.circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: this.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: this.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimSignatureR8x:
        this.circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        this.circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        this.circuitClaimData.signatureProof.signature.S.toString(),

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

      issuerAuthClaim:
        this.circuitClaimData.signatureProof.issuerAuthClaim?.marshalJson(),
      issuerAuthClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthIncProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimsTreeRoot:
        this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.claimsRoot.string(),
      issuerAuthRevTreeRoot:
        this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.revocationRoot.string(),
      issuerAuthRootsTreeRoot:
        this.circuitClaimData.signatureProof.issuerAuthIncProof.treeState?.rootOfRoots.string(),

      issuerAuthClaimNonRevMtp: prepareSiblingsStr(
        this.circuitClaimData.signatureProof.issuerAuthNonRevProof.proof,
        defaultMTLevels,
      ),
      issuerAuthClaimNonRevMtpNoAux: this.nodeAuxIssuerAuthNonRev.noAux,
      issuerAuthClaimNonRevMtpAuxHi: this.nodeAuxIssuerAuthNonRev.key.string(),
      issuerAuthClaimNonRevMtpAuxHv:
        this.nodeAuxIssuerAuthNonRev.value.string(),

      issuerClaim: this.circuitClaimData.claim.marshalJson(),
      isRevocationChecked: '1',
      issuerClaimNonRevMtp: prepareSiblingsStr(
        this.nonRevProof.proof,
        defaultMTLevels,
      ),
      issuerClaimNonRevMtpNoAux: this.nodeAuxNonRev.noAux,
      issuerClaimNonRevMtpAuxHi: this.nodeAuxNonRev.key.string(),
      issuerClaimNonRevMtpAuxHv: this.nodeAuxNonRev.value.string(),
      issuerClaimNonRevClaimsTreeRoot:
        this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimSignatureR8x:
        this.circuitClaimData.signatureProof.signature.R8[0].toString(),
      issuerClaimSignatureR8y:
        this.circuitClaimData.signatureProof.signature.R8[1].toString(),
      issuerClaimSignatureS:
        this.circuitClaimData.signatureProof.signature.S.toString(),

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
      issuerClaimNonRevClaimsTreeRoot:
        this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot:
        this.circuitClaimData.incProof.treeState?.claimsRoot.string(),
      issuerClaimRevTreeRoot:
        this.circuitClaimData.incProof.treeState?.revocationRoot.string(),
      issuerClaimRootsTreeRoot:
        this.circuitClaimData.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState:
        this.circuitClaimData.incProof.treeState?.state.string(),

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
      issuerClaimNonRevClaimsTreeRoot:
        this.nonRevProof.treeState.claimsRoot.string(),
      issuerClaimNonRevRevTreeRoot:
        this.nonRevProof.treeState.revocationRoot.string(),
      issuerClaimNonRevRootsTreeRoot:
        this.nonRevProof.treeState.rootOfRoots.string(),
      issuerClaimNonRevState: this.nonRevProof.treeState.state.string(),

      issuerClaimMtp: prepareSiblingsStr(
        this.circuitClaimData.incProof.proof,
        defaultMTLevels,
      ),
      issuerClaimClaimsTreeRoot:
        this.circuitClaimData.incProof.treeState?.claimsRoot.string(),
      issuerClaimRevTreeRoot:
        this.circuitClaimData.incProof.treeState?.revocationRoot.string(),
      issuerClaimRootsTreeRoot:
        this.circuitClaimData.incProof.treeState?.rootOfRoots.string(),
      issuerClaimIdenState:
        this.circuitClaimData.incProof.treeState?.state.string(),

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
