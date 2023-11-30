import * as crypto from 'crypto';
import { Hex, PrivateKey } from '@iden3/js-crypto';
import { hashVC, VCManager } from '../helpers';
import {
  ClaimOffer,
  CreateProofRequestParams,
  ProofQuery,
  W3CCredential,
} from '../types';
import { CircuitId } from '../enums';

const dummyOffer: ClaimOffer = {
  body: {
    credentials: [
      {
        description: 'urn:uuid:6dff4518-5177-4f39-af58-9c156d9b6309',
        id: 'cb43c431-8ddc-11ee-8b6e-06feca5194ee',
      },
    ],
    url: 'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/agent',
  },
  from: 'did:iden3:tLd8sbb1xTSvi2wtRF4TUVcfDUr8ppYMohLqjhGQT',
  id: 'ba99e52a-bd9a-40cf-bc01-e736c37713f8',
  thid: 'ba99e52a-bd9a-40cf-bc01-e736c37713f8',
  to: 'did:iden3:tQnU2hhZSkUMvA7PGqy8X3f39f4ywgvUM3kiv48XW',
  typ: 'application/iden3comm-plain-json',
  type: 'https://iden3-communication.io/credentials/1.0/offer',
};

const dummyVC: W3CCredential = {
  id:
    'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/credentials/cb43c431-8ddc-11ee-8b6e-06feca5194ee',
  '@context': [
    'https://ipfs.rarimo.com/ipfs/QmYCGiCoDn9WVoSwUBA8XLhgjzbeYLWZPfoM3scdtkWpfF',
    'https://schema.iden3.io/core/jsonld/iden3proofs.jsonld',
    'https://ipfs.rarimo.com/ipfs/Qmdw8ugiKw62eVoYdDmEuvLj4SXHD2bWGU48CbNDSMVKuU',
  ],
  type: ['VerifiableCredential', 'IdentityProviders'],
  issuanceDate: '2023-11-28T10:56:33.760252645Z',
  credentialSubject: {
    address: '0x8100428Fd8e67787564ad56C4b2CEbCA3B31c45C',
    civicGatekeeperNetworkId: 4,
    gitcoinPassportScore: 'none',
    id: 'did:iden3:tQnU2hhZSkUMvA7PGqy8X3f39f4ywgvUM3kiv48XW',
    isNatural: 1,
    kycAdditionalData: 'none',
    provider: 'Civic',
    type: 'IdentityProviders',
    unstoppableDomain: 'none',
    worldcoinScore: 'none',
  },
  credentialStatus: {
    id:
      'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/credentials/revocation/status/1250389945',
    revocationNonce: 1250389945,
    type: 'SparseMerkleTreeProof',
  },
  issuer: 'did:iden3:tLd8sbb1xTSvi2wtRF4TUVcfDUr8ppYMohLqjhGQT',
  credentialSchema: {
    id:
      'https://ipfs.rarimo.com/ipfs/QmTJ5FB4wMUpxtDcj2Tp1vqYe2NeeXZjVNfQC46mpo34wv',
    type: 'JsonSchema2023',
  },
  proof: [
    {
      type: 'BJJSignature2021',
      issuerData: {
        id: 'did:iden3:tLd8sbb1xTSvi2wtRF4TUVcfDUr8ppYMohLqjhGQT',
        updateUrl:
          'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/claims/a780d2fd-22ec-435e-8f05-eae04205c2d9/mtp',
        state: {
          claimsTreeRoot:
            '9747653320df0cd590ee5b84f87bbbe2c3b286b62ba9a1645cda0d6d59742024',
          value:
            'cd96cf691736b9bd8904bd7c8908a1fb634062297c94017175a9542de8fbac0a',
        },
        authCoreClaim:
          'cca3371a6cb1b715004407e325bd993c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009b96a8f6eeb9cca85294c178d2ea6cc3d971e806b26f313cac4308eebbd00b0b8dc52c8622de9aee96eff59fde209fc688c76a638029a7cdb1b9010c249737090000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        mtp: {
          existence: true,
          siblings: [],
        },
        credentialStatus: {
          id:
            'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/credentials/revocation/status/0',
          revocationNonce: 0,
          type: 'SparseMerkleTreeProof',
        },
      },
      coreClaim:
        '11d9dcf5ebe39bd8b48f0d9e2d813214220000000000000000000000000000000100926171374b0bab5269fa51685484083cb1ace4ec39d69abb6fdb1a1c0d0088747192a098222e2236d626c2efa5bb437bbf3d0a70b6df2555f0c2cae9f80d0000000000000000000000000000000000000000000000000000000000000000b96f874a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      signature:
        '99e9410ad406f86c375b4961b4b9aaf991b52f37f067718474a45d516929bb0b1a3c4adeeb79d0702821d92b19733805f483db265a9a7da497cc42bdc4db1503',
    },
    {
      id:
        'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/claims/cb43c431-8ddc-11ee-8b6e-06feca5194ee/mtp',
      type: 'Iden3SparseMerkleTreeProof',
      issuerData: {
        id: 'did:iden3:tLd8sbb1xTSvi2wtRF4TUVcfDUr8ppYMohLqjhGQT',
        updateUrl:
          'https://issuer.polygon.robotornot.mainnet-beta.rarimo.com/v1/claims/a780d2fd-22ec-435e-8f05-eae04205c2d9/mtp',
        state: {
          txId:
            '0xde78486369e8a937e0226f361fa87f077197c5bd4e955b7c55b3a02fbe6dd36d',
          blockTimestamp: 1701169006,
          blockNumber: 2235238,
          rootOfRoots:
            '22f25b788168228e6a8a2f37e617eb161d95af0372c5e314f081838bf92f782e',
          claimsTreeRoot:
            'f67bd5787a32d88e821218e4537f65e58cd728d2b44a83587f923d506374cc0c',
          revocationTreeRoot:
            '0000000000000000000000000000000000000000000000000000000000000000',
          value:
            '2ca1c7faea7f6e66b48cdc2dd5087bd44324b995bb1fec37cdae9f655809f903',
        },
      },
      coreClaim:
        '11d9dcf5ebe39bd8b48f0d9e2d813214220000000000000000000000000000000100926171374b0bab5269fa51685484083cb1ace4ec39d69abb6fdb1a1c0d0088747192a098222e2236d626c2efa5bb437bbf3d0a70b6df2555f0c2cae9f80d0000000000000000000000000000000000000000000000000000000000000000b96f874a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      mtp: {
        existence: true,
        siblings: [
          '19024344007810320629541446405864136429933108526974365027523072864851953852729',
          '9102521048383445289202304630633650804956787863823965484563169301255132900273',
          '19709089068324863107968940409532472522071733908500865549990483422746006938781',
          '14875109561057147290904786505306894891086176673576149964675655767873444698279',
          '17842863886555059413417814995207857247384599772382468186567380825126690613521',
          '15898886705705143063647197250660265981008147884625819949690638195768116402136',
        ],
      },
    },
  ],
};

const dummyQueryProofRequest: CreateProofRequestParams = {
  circuitId: CircuitId.AtomicQueryMTPV2OnChain,
  accountAddress: '0x...',
  issuerDid: dummyVC.issuer,

  query: {
    allowedIssuers: ['*'],
    credentialSubject: {
      isNatural: {
        $eq: 1,
      },
    },
    type: dummyVC.credentialSubject.type as string,
  },
};

const dummyQueryProof: ProofQuery = {
  allowedIssuers: ['*'],
  credentialSubject: {
    isNatural: {
      $eq: 1,
    },
  },
  type: dummyVC.credentialSubject.type as string,
};

const initPrivateKey = (hexString?: string): string => {
  let arr;
  if (hexString) {
    arr = Hex.decodeString(hexString);
  } else {
    arr = crypto.randomBytes(32);

    return initPrivateKey(new PrivateKey(arr).hex());
  }
  return new PrivateKey(arr).hex();
};

describe('Verifiable Credentials', () => {
  const pkHex1 = initPrivateKey();
  const pkHex2 = initPrivateKey();

  it('should encrypt and save Verifiable Credentials for "user 1" and "user 2"', async () => {
    const [vcManager1, vcManager2] = await Promise.all([
      VCManager.create(pkHex1),
      VCManager.create(pkHex2),
    ]);

    await expect(vcManager1.encryptAndSaveVC(dummyVC)).resolves.not.toThrow();

    await expect(vcManager2.encryptAndSaveVC(dummyVC)).resolves.not.toThrow();
  }, 100_000);

  it('should fetch and decrypt Verifiable Credentials of "user 1" and "user 2"', async () => {
    const [vcManager1, vcManager2] = await Promise.all([
      VCManager.create(pkHex1),
      VCManager.create(pkHex2),
    ]);

    const vc1 = await vcManager1.getAllDecryptedVCs();
    const vc2 = await vcManager2.getAllDecryptedVCs();

    expect(vc1).toHaveLength(1);
    expect(vc2).toHaveLength(1);
  }, 100_000);

  it('should not save Verifiable Credentials for "user 1" and "user 2"', async () => {
    const [vcManager1, vcManager2] = await Promise.all([
      VCManager.create(pkHex1),
      VCManager.create(pkHex2),
    ]);

    await expect(vcManager1.encryptAndSaveVC(dummyVC)).resolves.not.toThrow();

    await expect(vcManager2.encryptAndSaveVC(dummyVC)).resolves.not.toThrow();

    const vc1 = await vcManager1.getAllDecryptedVCs();
    const vc2 = await vcManager2.getAllDecryptedVCs();

    expect(vc1).toHaveLength(1);
    expect(vc2).toHaveLength(1);
  }, 100_000);

  it('should fetch and decrypt Verifiable Credentials of "user 1" and "user 2" by offer', async () => {
    const [vcManager1, vcManager2] = await Promise.all([
      VCManager.create(pkHex1),
      VCManager.create(pkHex2),
    ]);

    const vc1 = await vcManager1.getDecryptedVCsByOffer(dummyOffer);
    const vc2 = await vcManager2.getDecryptedVCsByOffer(dummyOffer);

    expect(vc1).toHaveLength(1);
    expect(vc2).toHaveLength(1);
  }, 100_000);

  it('should fetch and decrypt Verifiable Credentials of "user 1" and "user 2" by query hash', async () => {
    const [vcManager1, vcManager2] = await Promise.all([
      VCManager.create(pkHex1),
      VCManager.create(pkHex2),
    ]);

    const queryHash = hashVC(
      String(dummyVC.credentialSubject.type),
      dummyVC.issuer,
    );

    const vc1 = await vcManager1.getDecryptedVCsByQueryHash(queryHash);
    const vc2 = await vcManager2.getDecryptedVCsByQueryHash(queryHash);

    expect(vc1).toHaveLength(1);
    expect(vc2).toHaveLength(1);
  }, 100_000);

  it('should fetch and decrypt Verifiable Credentials of "user 1" and "user 2" by query proof', async () => {
    const [vcManager1, vcManager2] = await Promise.all([
      VCManager.create(pkHex1),
      VCManager.create(pkHex2),
    ]);

    const vc1 = await vcManager1.getDecryptedVCsByQuery(
      dummyQueryProof,
      dummyQueryProofRequest.issuerDid,
    );
    const vc2 = await vcManager2.getDecryptedVCsByQuery(
      dummyQueryProof,
      dummyQueryProofRequest.issuerDid,
    );

    expect(vc1).toHaveLength(1);
    expect(vc2).toHaveLength(1);
  }, 100_000);
});
