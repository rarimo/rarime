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
          body: {
            credentials: [
              {
                description: 'Natural Person',
                id: '86531650-023c-4c6c-a437-a82e137ead68',
              },
            ],
            url: 'http://127.0.0.1:8000/integrations/issuer/v1/public/claims/offers/callback',
          },
          from: 'did:iden3:tJnRoZ1KqUPbsfVGrk8io51iqoRc5dGhj5LLMHSrD',
          id: '026035f6-42f6-4a2d-b516-0b11d2674850',
          thid: '348b7198-7cb1-46f4-bc0a-98a358f65539',
          to: 'did:iden3:tTxif8ahrSqRWavS8Qatrp4ZEJvPdu3ELSMgqTEQN',
          typ: 'application/iden3comm-plain-json',
          type: 'https://iden3-communication.io/credentials/1.0/offer',
        },
      },
    },
  });
  console.log(data);
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
