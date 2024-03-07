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
import type { NodeAux } from '@iden3/js-merkletree';
import { Hash, Proof, ZERO_HASH } from '@iden3/js-merkletree';
import type { ProofQuery } from '@rarimo/rarime-connector';

import { QueryOperators } from '@/const';
import { ProofType } from '@/enums';
import {
  getRevocationStatus,
  loadDataByUrl,
} from '@/helpers/credential-helpers';
import { parseDidV2 } from '@/helpers/identity-helpers';
import {
  BJJSignatureProof2021,
  CircuitClaim,
  Iden3SparseMerkleTreeProof,
  Query,
  ValueProof,
} from '@/helpers/model-helpers';
import type {
  GISTProof,
  JSONSchema,
  MTProof,
  NodeAuxValue,
  QueryWithFieldName,
  RevocationStatus,
  StateProof,
  TreeState,
  W3CCredential,
} from '@/types';

export const extractProof = (proof: {
  [key: string]: any;
}): { claim: Claim; proofType: ProofType } => {
  if (proof instanceof Iden3SparseMerkleTreeProof) {
    return {
      claim: new Claim().fromHex(proof.coreClaim),
      proofType: ProofType.Iden3SparseMerkleTreeProof,
    };
  }

  if (proof instanceof BJJSignatureProof2021) {
    return {
      claim: new Claim().fromHex(proof.coreClaim),
      proofType: ProofType.BJJSignature,
    };
  }

  if (typeof proof === 'object') {
    const defaultProofType = proof.type;
    if (!defaultProofType) {
      throw new TypeError('proof type is not specified');
    }
    const coreClaimHex = proof.coreClaim;
    if (!coreClaimHex) {
      throw new TypeError(
        `coreClaim field is not defined in proof type ${defaultProofType}`,
      );
    }
    return {
      claim: new Claim().fromHex(coreClaimHex),
      proofType: defaultProofType as ProofType,
    };
  }

  throw new TypeError('proof format is not supported');
};

export const getCoreClaimFromProof = (
  credentialProof: object | any[],
  proofType: ProofType,
): Claim | null => {
  if (Array.isArray(credentialProof)) {
    for (const proof of credentialProof) {
      const { claim, proofType: extractedProofType } = extractProof(proof);
      if (proofType === extractedProofType) {
        return claim;
      }
    }
  } else if (typeof credentialProof === 'object') {
    const { claim, proofType: extractedProofType } =
      extractProof(credentialProof);
    if (extractedProofType === proofType) {
      return claim;
    }
  }
  return null;
};

export const getBJJSignature2021Proof = (
  credentialProof: object | any[],
): BJJSignatureProof2021 | null => {
  const proofType: ProofType = ProofType.BJJSignature;
  if (Array.isArray(credentialProof)) {
    for (const proof of credentialProof) {
      const { proofType: extractedProofType } = extractProof(proof);
      if (proofType === extractedProofType) {
        return proof as BJJSignatureProof2021;
      }
    }
  } else if (typeof credentialProof === 'object') {
    const { proofType: extractedProofType } = extractProof(credentialProof);
    if (extractedProofType === proofType) {
      return credentialProof as BJJSignatureProof2021;
    }
  }
  return null;
};

export const getIden3SparseMerkleTreeProof = (
  credentialProof: object | any[],
): Iden3SparseMerkleTreeProof | null => {
  const proofType: ProofType = ProofType.Iden3SparseMerkleTreeProof;
  if (Array.isArray(credentialProof)) {
    for (const proof of credentialProof) {
      const { proofType: extractedProofType } = extractProof(proof);
      if (proofType === extractedProofType) {
        return proof as Iden3SparseMerkleTreeProof;
      }
    }
  } else if (typeof credentialProof === 'object') {
    const { proofType: extractedProofType } = extractProof(credentialProof);
    if (extractedProofType === proofType) {
      return credentialProof as Iden3SparseMerkleTreeProof;
    }
  }
  return null;
};

export const buildTreeState = (
  state: string,
  claimsTreeRoot: string,
  revocationTreeRoot: string,
  rootOfRoots: string,
): TreeState => ({
  state: Hash.fromHex(state),
  claimsRoot: Hash.fromHex(claimsTreeRoot),
  revocationRoot: Hash.fromHex(revocationTreeRoot),
  rootOfRoots: Hash.fromHex(rootOfRoots),
});

export const convertEndianSwappedCoreStateHashHex = (hash: string) => {
  const convertedStateHash = fromLittleEndian(
    Hex.decodeString(hash.slice(2)),
  ).toString(16);

  return convertedStateHash?.length < 64
    ? `0x0${convertedStateHash}`
    : `0x${convertedStateHash}`;
};

export const newCircuitClaimData = async (
  credential: W3CCredential,
  coreClaim: Claim,
  coreStateHash: string,
): Promise<CircuitClaim> => {
  const circuitClaim = new CircuitClaim();
  circuitClaim.claim = coreClaim;

  const issuerDid = parseDidV2(credential.issuer);

  circuitClaim.issuerId = DID.idFromDID(issuerDid);

  const smtProof = getIden3SparseMerkleTreeProof(credential.proof!);

  if (smtProof) {
    const data = await loadDataByUrl(
      smtProof.id,
      convertEndianSwappedCoreStateHashHex(coreStateHash),
    );

    circuitClaim.incProof = {
      proof: data.mtp,
      treeState: buildTreeState(
        data.issuer.state,
        data.issuer.claimsTreeRoot,
        data.issuer.revocationTreeRoot,
        data.issuer.rootOfRoots,
      ),
    };
  }

  const sigProof = getBJJSignature2021Proof(credential.proof!);

  if (sigProof) {
    const decodedSignature = Hex.decodeString(sigProof.signature);
    const signature = Signature.newFromCompressed(decodedSignature);
    const issuerAuthClaimIncMtp = await loadDataByUrl(
      sigProof.issuerData.updateUrl,
      convertEndianSwappedCoreStateHashHex(coreStateHash),
    );
    const rs: RevocationStatus = await getRevocationStatus(
      sigProof.issuerData.credentialStatus!,
    );

    const issuerAuthNonRevProof: MTProof = {
      treeState: buildTreeState(
        rs.issuer.state!,
        rs.issuer.claimsTreeRoot!,
        rs.issuer.revocationTreeRoot!,
        rs.issuer.rootOfRoots!,
      ),
      proof: rs.mtp,
    };
    if (!sigProof.issuerData.mtp) {
      throw new TypeError('issuer auth credential must have a mtp proof');
    }

    if (!sigProof.issuerData.authCoreClaim) {
      throw new TypeError(
        'issuer auth credential must have a core claim proof',
      );
    }

    circuitClaim.signatureProof = {
      signature,
      issuerAuthIncProof: {
        proof: issuerAuthClaimIncMtp.mtp,
        treeState: buildTreeState(
          issuerAuthClaimIncMtp.issuer.state!,
          issuerAuthClaimIncMtp.issuer.claimsTreeRoot!,
          issuerAuthClaimIncMtp.issuer.revocationTreeRoot!,
          issuerAuthClaimIncMtp.issuer.rootOfRoots!,
        ),
      },
      issuerAuthClaim: new Claim().fromHex(sigProof.issuerData.authCoreClaim),
      issuerAuthNonRevProof,
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

export const parseRequest = async (req?: {
  [key: string]: any;
}): Promise<QueryWithFieldName> => {
  if (!req) {
    const query = new Query();
    query.operator = QueryOperators.$eq;
    return { query, fieldName: '' };
  }

  const entries = Object.entries(req);
  if (entries.length > 1) {
    throw new TypeError(`multiple requests  not supported`);
  }

  const [fieldName, fieldReq] = entries[0];

  const fieldReqEntries = Object.entries<any>(fieldReq);

  if (fieldReqEntries.length > 1) {
    throw new TypeError(`multiple predicates for one field not supported`);
  }

  const isSelectiveDisclosure = fieldReqEntries.length === 0;
  const query = new Query();

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
    values[0] = BigInt(value);
  }

  query.operator = operator;
  query.values = values;

  return { query, fieldName };
};

export const merklize = async (
  credential: W3CCredential,
): Promise<Merklizer> => {
  const crdntl = { ...credential };
  delete crdntl.proof;
  return await Merklizer.merklizeJSONLD(JSON.stringify(crdntl));
};

export const prepareMerklizedQuery = async (
  query: ProofQuery,
  credential: W3CCredential,
): Promise<Query> => {
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
  parsedQuery.query.valueProof = new ValueProof();
  parsedQuery.query.valueProof.mtp = proof;
  parsedQuery.query.valueProof.path = pathKey;
  parsedQuery.query.valueProof.mtp = proof;
  const mtEntry = await mtValue?.mtEntry();
  parsedQuery.query.valueProof.value = mtEntry;

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

export const getFieldSlotIndex = (
  field: string,
  schemaBytes: Uint8Array,
): number => {
  const schema: JSONSchema = JSON.parse(new TextDecoder().decode(schemaBytes));
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
      throw new TypeError(`field ${field} not specified in serialization info`);
  }
};

export const stringByPath = (
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

export const buildQueryPath = async (
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

export const verifiablePresentationFromCred = async (
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

export const prepareNonMerklizedQuery = async (
  query: ProofQuery,
  credential: W3CCredential,
): Promise<Query> => {
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

export const toCircuitsQuery = async (
  query: ProofQuery,
  credential: W3CCredential,
  coreClaim: Claim,
): Promise<Query> => {
  const mtPosition = coreClaim.getMerklizedPosition();

  return mtPosition === MerklizedRootPosition.None
    ? prepareNonMerklizedQuery(query, credential)
    : prepareMerklizedQuery(query, credential);
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

export const getNodeAuxValue = (p: Proof | undefined): NodeAuxValue => {
  // proof of inclusion
  if (p?.existence) {
    return {
      key: ZERO_HASH,
      value: ZERO_HASH,
      noAux: '0',
    };
  }

  // proof of non-inclusion (NodeAux exists)
  if (p?.nodeAux?.value !== undefined && p?.nodeAux?.key !== undefined) {
    return {
      key: p.nodeAux.key,
      value: p.nodeAux.value,
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

export const toGISTProof = (smtProof: StateProof): GISTProof => {
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
