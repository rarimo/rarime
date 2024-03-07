import { Hex, PrivateKey } from '@iden3/js-crypto';
import {
  Claim,
  ClaimOptions,
  DID,
  fromBigEndian,
  idenState,
  SchemaHash,
} from '@iden3/js-iden3-core';
import type { Proof } from '@iden3/js-merkletree';
import { hashElems, InMemoryDB, Merkletree } from '@iden3/js-merkletree';

import { defaultMTLevels } from '@/const';
import { initPrivateKey, prepareSiblingsStr } from '@/helpers';

type Config = {
  idType: Uint8Array;
  schemaHashHex: string;
};

export class Identity {
  config: Config;

  privateKeyHex = '' as string;

  did: DID = {} as DID;

  authClaimIncProofSiblings: string[] = [];

  authClaimNonRevProof: Proof = {} as Proof;

  treeState: {
    state: string;
    claimsRoot: string;
    revocationRoot: string;
    rootOfRoots: string;
  };

  coreAuthClaim: Claim = {} as Claim;

  public static async create(
    config: Config,
    privateKeyHex?: string,
  ): Promise<Identity> {
    const identity = new Identity(config, privateKeyHex);

    await identity.createIdentity();

    return identity;
  }

  constructor(config: Config, privateKeyHex?: string) {
    this.config = config;

    this.privateKeyHex = initPrivateKey(privateKeyHex);

    this.treeState = {
      state: '',
      claimsRoot: '',
      revocationRoot: '',
      rootOfRoots: '',
    };
  }

  public get privateKey() {
    return new PrivateKey(Hex.decodeString(this.privateKeyHex));
  }

  public get didString() {
    return this.did.string();
  }

  public get identityIdBigIntString() {
    const id = DID.idFromDID(this.did);

    return String(id.bigInt());
  }

  async createIdentity() {
    this.coreAuthClaim = this.createCoreAuthClaim();

    const authResponse = this.coreAuthClaim.hiHv();

    const uint8array1 = new TextEncoder().encode('claims');
    const uint8array2 = new TextEncoder().encode('revocations');
    const uint8array3 = new TextEncoder().encode('roots');

    const storage1 = new InMemoryDB(uint8array1);
    const storage2 = new InMemoryDB(uint8array2);
    const storage3 = new InMemoryDB(uint8array3);

    const claimsTree = new Merkletree(storage1, true, 32);
    const revocationsTree = new Merkletree(storage2, true, 32);
    const rootsTree = new Merkletree(storage3, true, 32);

    await claimsTree.add(authResponse.hi, authResponse.hv);

    const claimsTreeRoot = await claimsTree.root();
    const revocationsTreeRoot = await revocationsTree.root();
    const rootsTreeRoot = await rootsTree.root();

    const identity = idenState(
      claimsTreeRoot.bigInt(),
      revocationsTreeRoot.bigInt(),
      rootsTreeRoot.bigInt(),
    );

    this.did = DID.newFromIdenState(this.config.idType, identity);

    const authClaimIncProof = await claimsTree.generateProof(
      this.coreAuthClaim.hIndex(),
      claimsTreeRoot,
    );

    const authClaimIncProofSiblings = prepareSiblingsStr(
      authClaimIncProof.proof,
      defaultMTLevels,
    );

    const authClaimNonRevProof = await revocationsTree.generateProof(
      this.coreAuthClaim.getRevocationNonce(),
      revocationsTreeRoot,
    );

    this.authClaimIncProofSiblings = authClaimIncProofSiblings;
    this.authClaimNonRevProof = authClaimNonRevProof.proof;

    const stateHash = hashElems([
      claimsTreeRoot.bigInt(),
      revocationsTreeRoot.bigInt(),
      rootsTreeRoot.bigInt(),
    ]);

    this.treeState = {
      state: stateHash.string(),
      claimsRoot: claimsTreeRoot.string(),
      revocationRoot: revocationsTreeRoot.string(),
      rootOfRoots: rootsTreeRoot.string(),
    };
  }

  createCoreAuthClaim() {
    const hash = SchemaHash.newSchemaHashFromHex(this.config.schemaHashHex);
    const revNonce = new Uint8Array(64);
    const key = this.privateKey.public();

    return Claim.newClaim(
      hash,
      ClaimOptions.withIndexDataInts(key.p[0], key.p[1]),
      ClaimOptions.withRevocationNonce(fromBigEndian(revNonce)),
    );
  }
}
