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

export const createIdentity = async () => {
  const did = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'create_identity' },
    },
  });

  await fetch(
    `http://127.0.0.1:8000/integrations/issuer/v1/private/claims/issue/${
      did.split(':')[2]
    }/NaturalPerson`,
    {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            credential_subject: {
              is_natural: '1',
            },
            expiration: '2024-01-16T17:34:29+00:00',
          },
        },
      }),
    },
  );
  console.log(did);
};

export const sendVc = async () => {
  const did = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'create_identity' },
    },
  });

  const response = await fetch(
    `http://127.0.0.1:8000/integrations/issuer/v1/public/claims/offers/${
      did.split(':')[2]
    }/NaturalPerson`,
  );
  const offer = await response.json();

  const data = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'save_credentials',
        params: offer.data.attributes,
      },
    },
  });
  console.log(data);
};

export const createProof = async () => {
  const data = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'create_proof',
        params: {
          circuitId: 'credentialAtomicQueryMTPV2',
          query: {
            allowedIssuers: ['*'],
            context:
              'https://raw.githubusercontent.com/omegatymbjiep/schemas/main/json-ld/NaturalPerson.json-ld',
            credentialSubject: {
              isNatural: {
                $eq: 1,
              },
            },
            type: 'NaturalPerson',
          },
        },
      },
    },
  });

  console.log(data);
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
