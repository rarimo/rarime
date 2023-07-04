import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

/**
 * Invoke the "hello" method from the example snap.
 */

export const sendHello = async () => {
  const data = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'create_identity' },
    },
  });
  console.log(data);
};

export const sendVc = async () => {
  const data = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'save_credentials',
        params: {
          verifiableCredentials: [
            {
              id: 'http://127.0.0.1:8000/integrations/issuer/v1/private/claims/55899f6e-22f0-48c6-8a42-2009c81955a7',
              '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://schema.iden3.io/core/jsonld/iden3proofs.jsonld',
                'https://raw.githubusercontent.com/omegatymbjiep/schemas/main/json-ld/NaturalPerson.json-ld',
              ],
              type: ['VerifiableCredential', 'NaturalPerson'],
              expirationDate: '2024-01-16T17:34:29Z',
              issuanceDate: '2023-06-28T14:33:11.327702314Z',
              credentialSubject: {
                id: 'did:iden3:tLPWimytbxDbUDc9fKoem4YYHWq8bGEMcTRjohC1Z',
                isNatural: 1,
                type: 'NaturalPerson',
              },
              credentialStatus: {
                id: 'http://127.0.0.1:8000/integrations/issuer/v1/public/claims/revocations/check/2736598555',
                revocationNonce: 2736598555,
                type: 'SparseMerkleTreeProof',
              },
              issuer: 'did:iden3:tQeMy63cppKwTtZBML4eauuKVdDZRhE73ze3yPR8g',
              credentialSchema: {
                id: 'https://raw.githubusercontent.com/OmegaTymbJIep/schemas/main/json/NaturalPerson.json',
                type: 'JsonSchemaValidator2018',
              },
              proof: [
                {
                  type: 'BJJSignature2021',
                  issuerData: {
                    id: 'did:iden3:tQeMy63cppKwTtZBML4eauuKVdDZRhE73ze3yPR8g',
                    state: {
                      txId: '0x4fda77382cce0368ef94615c0d241d0d20f1205bb84235495fd0d46784f0b27d',
                      blockTimestamp: 1687962854,
                      blockNumber: 37363649,
                      rootOfRoots:
                        'd9d2fb531f56d1d8d0cceb52f48b34bfb7320b5823d1525e92591a885cbbd72e',
                      claimsTreeRoot:
                        'fbebede16104557abef98d9fee6d0381a738360926214a86c517e8e679315408',
                      revocationTreeRoot:
                        '6d09ade8b49ef273d9b7284c199cd7e0f9274b0256b832be6fadc42fa738d62f',
                      value:
                        '795d3299c6049640b2305a3d0639a960b9510a2a064f12b3e6394ab1d1825928',
                    },
                    authCoreClaim:
                      'cca3371a6cb1b715004407e325bd993c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000af6b36a7101f023a0f1ff2763a236a3584d2696b89ca3dec18b5df600ef25327635e3305cab688db4c4ab29d405ef1a511dc8d6812080ecb9b7bddfb9083221d6141be1500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                    mtp: {
                      existence: true,
                      siblings: [
                        '0',
                        '3724262096864659543083701611359616719722081775643264147436161874717458234646',
                      ],
                    },
                    credentialStatus: {
                      id: 'http://127.0.0.1:8000/integrations/issuer/v1/public/claims/revocations/check/364790113',
                      revocationNonce: 364790113,
                      type: 'SparseMerkleTreeProof',
                    },
                  },
                  coreClaim:
                    '5dffadf24595eaf7efad641542f7603b4a0000000000000000000000000000000100318d317dffef2835cd1793f0fdf51c2f3de22ec3970f6599286e04aa0c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b2e1da30000000025bea66500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000edf9c918441338f20f16531f38635a77f91bd4c741b6a00a18269bb35cf89c070000000000000000000000000000000000000000000000000000000000000000',
                  signature:
                    'a0aebe08e78541237d22986e056968406929a98ed456508d92cc949b3b576e0efb2222fe396ba44319f4cebed4350fe318df9029bf199eab211ea78e62c96900',
                },
                {
                  type: 'Iden3SparseMerkleProof',
                  issuerData: {
                    id: 'did:iden3:tQeMy63cppKwTtZBML4eauuKVdDZRhE73ze3yPR8g',
                    state: {
                      txId: '0x4fda77382cce0368ef94615c0d241d0d20f1205bb84235495fd0d46784f0b27d',
                      blockTimestamp: 1687962854,
                      blockNumber: 37363649,
                      rootOfRoots:
                        'd9d2fb531f56d1d8d0cceb52f48b34bfb7320b5823d1525e92591a885cbbd72e',
                      claimsTreeRoot:
                        'fbebede16104557abef98d9fee6d0381a738360926214a86c517e8e679315408',
                      revocationTreeRoot:
                        '6d09ade8b49ef273d9b7284c199cd7e0f9274b0256b832be6fadc42fa738d62f',
                      value:
                        '795d3299c6049640b2305a3d0639a960b9510a2a064f12b3e6394ab1d1825928',
                    },
                    authCoreClaim:
                      'cca3371a6cb1b715004407e325bd993c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000af6b36a7101f023a0f1ff2763a236a3584d2696b89ca3dec18b5df600ef25327635e3305cab688db4c4ab29d405ef1a511dc8d6812080ecb9b7bddfb9083221d6141be1500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                    mtp: {
                      existence: true,
                      siblings: [
                        '0',
                        '3724262096864659543083701611359616719722081775643264147436161874717458234646',
                      ],
                    },
                    credentialStatus: {
                      id: 'http://127.0.0.1:8000/integrations/issuer/v1/public/claims/revocations/check/364790113',
                      revocationNonce: 364790113,
                      type: 'SparseMerkleTreeProof',
                    },
                  },
                  coreClaim:
                    '5dffadf24595eaf7efad641542f7603b4a0000000000000000000000000000000100318d317dffef2835cd1793f0fdf51c2f3de22ec3970f6599286e04aa0c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b2e1da30000000025bea66500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000edf9c918441338f20f16531f38635a77f91bd4c741b6a00a18269bb35cf89c070000000000000000000000000000000000000000000000000000000000000000',
                  mtp: {
                    existence: true,
                    siblings: [
                      '0',
                      '4400156519176435046963649954906774055527565003804869211220145095104047774910',
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    },
  });
  console.log(data);
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
