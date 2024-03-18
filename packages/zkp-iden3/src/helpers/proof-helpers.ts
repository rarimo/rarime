/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/prefer-for-of */
import { Hex, Signature } from '@iden3/js-crypto';
import {
  Claim,
  DID,
  fromLittleEndian,
  MerklizedRootPosition,
} from '@iden3/js-iden3-core';
import type { MtValue } from '@iden3/js-jsonld-merklization';
import {
  getDocumentLoader,
  Merklizer,
  Path,
} from '@iden3/js-jsonld-merklization';
import type { NodeAux, ProofJSON } from '@iden3/js-merkletree';
import { Hash, Proof, ZERO_HASH } from '@iden3/js-merkletree';
import type { ProofQuery } from '@rarimo/rarime-connector';
import get from 'lodash/get';

import { QueryOperators } from '@/const';
import { ProofType } from '@/enums';
import { parseDidV2 } from '@/helpers/identity-helpers';
import type {
  BJJSignatureProofRaw,
  CircuitClaim,
  GISTProof,
  Iden3SparseMerkleTreeProofRaw,
  JSONSchema,
  NodeAuxValue,
  QueryWithFieldName,
  RevocationStatus,
  StateProof,
  TreeState,
  W3CCredential,
  Query,
} from '@/types';

const proofFromJson = (proofJson: ProofJSON) => {
  const preparedProofJson = {
    ...proofJson,
    nodeAux: get(proofJson, 'nodeAux') || get(proofJson, 'node_aux'),
  };

  return Proof.fromJSON(preparedProofJson);
};

export const buildTreeState = (
  state: string,
  claimsTreeRoot: string,
  revocationTreeRoot: string,
  rootOfRoots: string,
): TreeState => ({
  state: Hash.fromHex(state),
  claimsTreeRoot: Hash.fromHex(claimsTreeRoot),
  revocationTreeRoot: Hash.fromHex(revocationTreeRoot),
  rootOfRoots: Hash.fromHex(rootOfRoots),
});

const getRevocationStatus = async (
  url: string,
  endianSwappedCoreStateHash?: string,
): Promise<RevocationStatus> => {
  const response = await fetch(
    endianSwappedCoreStateHash
      ? `${url}?state=${endianSwappedCoreStateHash}`
      : url,
  );

  const data = await response.json();

  const mtp = proofFromJson(data.mtp);

  const issuer = buildTreeState(
    data.issuer.state,
    data.issuer.claimsTreeRoot,
    data.issuer.revocationTreeRoot,
    data.issuer.rootOfRoots,
  );

  return {
    mtp,
    issuer,
  };
};

const convertEndianSwappedCoreStateHashHex = (hash: string) => {
  const convertedStateHash = fromLittleEndian(
    Hex.decodeString(hash.slice(2)),
  ).toString(16);

  return convertedStateHash?.length < 64
    ? `0x0${convertedStateHash}`
    : `0x${convertedStateHash}`;
};

const parseRequest = async (req?: {
  [key: string]: unknown;
}): Promise<QueryWithFieldName> => {
  if (!req) {
    const query: Query = {} as Query;

    query.operator = QueryOperators.$eq;

    return { query, fieldName: '' };
  }

  const entries = Object.entries(req);

  if (entries.length > 1) {
    throw new TypeError(`multiple requests  not supported`);
  }

  const [fieldName, fieldReq] = entries[0];

  // FIXME
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const fieldReqEntries = Object.entries(fieldReq);

  if (fieldReqEntries.length > 1) {
    throw new TypeError(`multiple predicates for one field not supported`);
  }

  const isSelectiveDisclosure = fieldReqEntries.length === 0;

  const query: Query = {} as Query;

  if (isSelectiveDisclosure) {
    return { query, fieldName, isSelectiveDisclosure };
  }

  let operator = 0;
  const values: bigint[] = new Array<bigint>(64).fill(BigInt(0));
  const [kv, value] = fieldReqEntries[0];
  const key = kv as keyof typeof QueryOperators;
  if (!QueryOperators[key]) {
    throw new TypeError(`operator is not supported by lib`);
  }
  operator = QueryOperators[key];
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      values[index] = BigInt(value[index]);
    }
  } else {
    // FIXME
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    values[0] = BigInt(value);
  }

  query.operator = operator;
  query.values = values;

  return { query, fieldName };
};

const merklize = async (credential: W3CCredential): Promise<Merklizer> => {
  const crdntl = { ...credential };
  delete crdntl.proof;
  return await Merklizer.merklizeJSONLD(JSON.stringify(crdntl));
};

// ------------------------------------------------

// ==========================================================================
// helpers used in other files
// ==========================================================================

export const checkVCAndGetClaims = async (credential: W3CCredential) => {
  const revStatus = await getRevocationStatus(credential.credentialStatus.id);

  if (revStatus.mtp.existence) {
    throw new TypeError('credential is revoked');
  }

  if (!credential.proof?.length) {
    throw new TypeError('proof is not set in credential');
  }

  const sigProof = credential.proof?.find(
    (el) => el.type === ProofType.BJJSignature,
  );

  if (!sigProof) {
    throw new TypeError(
      `${ProofType.BJJSignature} proof is not set in credential`,
    );
  }

  const sigProofCoreClaim = new Claim().fromHex(sigProof.coreClaim);

  const mtpProof = credential.proof?.find(
    (el) => el.type === ProofType.Iden3SparseMerkleTreeProof,
  );

  if (!mtpProof) {
    throw new TypeError(
      `${ProofType.Iden3SparseMerkleTreeProof} proof is not set in credential`,
    );
  }

  const mtpProofCoreClaim = new Claim().fromHex(mtpProof?.coreClaim);

  if (
    mtpProofCoreClaim &&
    sigProofCoreClaim &&
    mtpProofCoreClaim.hex() !== sigProofCoreClaim.hex()
  ) {
    throw new TypeError(
      'core claim representations is set in both proofs but they are not equal',
    );
  }

  if (!mtpProofCoreClaim && !sigProofCoreClaim) {
    throw new TypeError('core claim is not set in proofs');
  }

  return {
    revStatus,
    mtpProofCoreClaim,
    sigProofCoreClaim,
  };
};

export const formatRawClaimToCircuitClaim = async (
  credential: W3CCredential,
  coreClaim: Claim,
  coreStateHash: string,
): Promise<CircuitClaim> => {
  let circuitClaim: CircuitClaim;

  const issuerDid = parseDidV2(credential.issuer);

  circuitClaim = {
    claim: coreClaim,
    issuerId: DID.idFromDID(issuerDid),
  };

  const smtProof = credential.proof?.find(
    (el) => el.type === ProofType.Iden3SparseMerkleTreeProof,
  ) as Iden3SparseMerkleTreeProofRaw;

  if (smtProof) {
    const revStatus = await getRevocationStatus(
      smtProof.id,
      convertEndianSwappedCoreStateHashHex(coreStateHash),
    );

    circuitClaim = {
      ...circuitClaim,
      // incProof === smtProf
      incProof: {
        proof: revStatus.mtp,
        treeState: revStatus.issuer,
      },
    };
  }

  const sigProof = credential.proof?.find(
    (el) => el.type === ProofType.BJJSignature,
  ) as BJJSignatureProofRaw;

  if (sigProof) {
    const decodedSignature = Hex.decodeString(sigProof.signature);
    const signature = Signature.newFromCompressed(decodedSignature);

    const issuerAuthClaimIncMtp = await getRevocationStatus(
      sigProof.issuerData.updateUrl,
      convertEndianSwappedCoreStateHashHex(coreStateHash),
    );

    const revStatus = await getRevocationStatus(
      sigProof.issuerData.credentialStatus.id,
    );

    if (!sigProof.issuerData.mtp) {
      throw new TypeError('issuer auth credential must have a mtp proof');
    }

    if (!sigProof.issuerData.authCoreClaim) {
      throw new TypeError(
        'issuer auth credential must have a core claim proof',
      );
    }

    circuitClaim = {
      ...circuitClaim,
      signatureProof: {
        signature,
        issuerAuthClaim: new Claim().fromHex(sigProof.issuerData.authCoreClaim),
        issuerAuthNonRevProof: {
          proof: revStatus.mtp,
          treeState: revStatus.issuer,
        },
        issuerAuthIncProof: {
          proof: issuerAuthClaimIncMtp.mtp,
          treeState: issuerAuthClaimIncMtp.issuer,
        },
      },
    };
  }

  return circuitClaim;
};

export const prepareSiblingsStr = (
  proof: Proof | { siblings: Hash[] },
  levels: number,
): string[] => {
  const siblings =
    proof instanceof Proof ? proof.allSiblings() : proof.siblings;

  // Add the rest of empty levels to the siblings
  for (let i = siblings.length; i < levels; i++) {
    siblings.push(ZERO_HASH);
  }
  return siblings.map((s) =>
    typeof s === 'string' ? s : s.bigInt().toString(),
  );
};

export const toCircuitsQuery = async (
  query: ProofQuery,
  credential: W3CCredential,
  coreClaim: Claim,
): Promise<Query> => {
  const prepareNonMerklizedQuery = async (): Promise<Query> => {
    const stringByPath = (
      // FIXME
      // eslint-disable-next-line
      obj: { [key: string]: any },
      path: string,
    ): string => {
      const parts = path.split('.');

      let value = obj;
      for (let index = 0; index < parts.length; index++) {
        const key = parts[index];
        if (!key) {
          throw new TypeError('path is empty');
        }
        value = value[key];
        if (value === undefined) {
          throw new TypeError('path not found');
        }
      }
      return value.toString();
    };

    const buildQueryPath = async (
      contextURL: string,
      contextType: string,
      field: string,
    ): Promise<Path> => {
      let resp;

      try {
        resp = await (await fetch(contextURL)).json();
      } catch (error) {
        throw new TypeError(`context not found: ${JSON.stringify(error)}`);
      }

      const path = await Path.getContextPathKey(
        JSON.stringify(resp),
        contextType,
        field,
      );
      path.prepend(['https://www.w3.org/2018/credentials#credentialSubject']);
      return path;
    };

    const verifiablePresentationFromCred = async (
      w3cCred: W3CCredential,
      requestObj: ProofQuery,
      field: string,
    ): Promise<MtValue | undefined> => {
      const mz = await merklize(w3cCred);

      const contextType = stringByPath(requestObj, 'type');

      const contextURL = stringByPath(requestObj, 'context');

      const path = await buildQueryPath(contextURL, contextType, field);

      const { value } = await mz.proof(path);

      return value;
    };

    const getFieldSlotIndex = (
      field: string,
      schemaBytes: Uint8Array,
    ): number => {
      const schema: JSONSchema = JSON.parse(
        new TextDecoder().decode(schemaBytes),
      );
      if (!schema?.$metadata?.serialization) {
        throw new TypeError('serialization info is not set');
      }

      switch (field) {
        case schema.$metadata?.serialization?.indexDataSlotA:
          return 2;
        case schema.$metadata?.serialization?.indexDataSlotB:
          return 3;
        case schema.$metadata?.serialization?.valueDataSlotA:
          return 6;
        case schema.$metadata?.serialization?.valueDataSlotB:
          return 7;
        default:
          throw new TypeError(
            `field ${field} not specified in serialization info`,
          );
      }
    };

    const loader = getDocumentLoader();

    let schema: object;

    try {
      schema = (await loader(credential.credentialSchema.id)).document;
    } catch (e) {
      throw new TypeError(
        `can't load credential schema ${credential['@context'][2]}`,
      );
    }

    if (
      query.credentialSubject &&
      Object.keys(query.credentialSubject).length > 1
    ) {
      throw new TypeError('multiple requests are not supported');
    }

    const parsedQuery = await parseRequest(query.credentialSubject);

    parsedQuery.query.slotIndex = getFieldSlotIndex(
      parsedQuery.fieldName,
      new TextEncoder().encode(JSON.stringify(schema)),
    );

    if (parsedQuery.isSelectiveDisclosure) {
      const mzValue = await verifiablePresentationFromCred(
        credential,
        query,
        parsedQuery.fieldName,
      );
      const resultQuery = parsedQuery.query;
      resultQuery.operator = QueryOperators.$eq;
      resultQuery.values = [await mzValue!.mtEntry()];
      return resultQuery;
    }

    return parsedQuery.query;
  };

  const prepareMerklizedQuery = async (): Promise<Query> => {
    const parsedQuery = await parseRequest(query.credentialSubject);

    const loader = getDocumentLoader();
    let schema: object;
    try {
      schema = (await loader(credential['@context'][2])).document;
    } catch (e) {
      throw new TypeError(
        `can't load credential schema ${credential['@context'][2]}`,
      );
    }

    let path: Path = new Path();
    if (parsedQuery.fieldName) {
      path = await Path.getContextPathKey(
        JSON.stringify(schema),
        credential.type[1],
        parsedQuery.fieldName,
      );
    }
    path.prepend(['https://www.w3.org/2018/credentials#credentialSubject']);

    const mk = await merklize(credential);
    const { proof, value: mtValue } = await mk.proof(path);

    const pathKey = await path.mtEntry();
    const mtEntry = await mtValue?.mtEntry();

    parsedQuery.query.valueProof = {
      mtp: proof,
      path: pathKey,
      value: mtEntry,
    };

    // for merklized credentials slotIndex in query must be equal to zero
    // and not a position of merklization root.
    // it has no influence on check in the off-chain circuits, but it aligns with onchain verification standard
    parsedQuery.query.slotIndex = 0;

    if (!parsedQuery.fieldName || parsedQuery.isSelectiveDisclosure) {
      const resultQuery = parsedQuery.query;
      resultQuery.operator = QueryOperators.$eq;
      resultQuery.values = [mtEntry!];
      return resultQuery;
    }

    return parsedQuery.query;
  };

  const mtPosition = coreClaim.getMerklizedPosition();

  return mtPosition === MerklizedRootPosition.None
    ? prepareNonMerklizedQuery()
    : prepareMerklizedQuery();
};

export const prepareCircuitArrayValues = (
  arr: bigint[],
  size: number,
): bigint[] => {
  if (arr.length > size) {
    throw new TypeError(
      `array size ${arr.length} is bigger max expected size ${size}`,
    );
  }

  // Add the empty values
  for (let i = arr.length; i < size; i++) {
    arr.push(BigInt(0));
  }

  return arr;
};

export const getNodeAuxValue = (proof: Proof): NodeAuxValue => {
  // proof of inclusion
  if (proof?.existence) {
    return {
      key: ZERO_HASH,
      value: ZERO_HASH,
      noAux: '0',
    };
  }

  // proof of non-inclusion (NodeAux exists)
  if (
    proof?.nodeAux?.value !== undefined &&
    proof?.nodeAux?.key !== undefined
  ) {
    return {
      key: proof.nodeAux.key,
      value: proof.nodeAux.value,
      noAux: '0',
    };
  }

  // proof of non-inclusion (NodeAux does not exist)
  return {
    key: ZERO_HASH,
    value: ZERO_HASH,
    noAux: '1',
  };
};

export const toGISTProof = (smtProof: StateProof): GISTProof => {
  const newProofFromData = (
    existence: boolean,
    allSiblings: Hash[],
    nodeAux?: NodeAux,
  ): Proof => {
    return new Proof({
      existence,
      nodeAux,
      siblings: allSiblings,
    });
  };

  let existence = false;
  let nodeAux;

  if (smtProof.existence) {
    existence = true;
  } else if (smtProof.auxExistence) {
    nodeAux = {
      key: Hash.fromBigInt(smtProof.auxIndex),
      value: Hash.fromBigInt(smtProof.auxValue),
    };
  }

  const allSiblings: Hash[] = smtProof.siblings.map((s) => Hash.fromBigInt(s));

  const proof = newProofFromData(existence, allSiblings, nodeAux);

  const root = Hash.fromBigInt(smtProof.root);

  return {
    root,
    proof,
  };
};
