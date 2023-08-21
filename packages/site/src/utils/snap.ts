/* eslint-disable import/no-extraneous-dependencies */
import { enableSnap, SnapConnector } from '@rarimo/connector';

let connector: SnapConnector;

export const connectSnap = async () => {
  const snap = await enableSnap();
  connector = await snap.getConnector();
  return snap;
};

export const createIdentity = async () => {
  const did = await connector.createIdentity();

  await fetch(
    `http://127.0.0.1:8000/integrations/issuer/v1/private/claims/issue/${
      did.split(':')[2]
    }/IdentityProviders`,
    {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            credential_subject: {
              is_natural: 1,
              provider: 'UnstoppableDomains',
              gitcoin_passport_score: '0.0',
              address: 'none',
              civic_gatekeeper_network_id: 0,
              worldcoin_score: 'none',
              unstoppable_domain: 'dlkharkiv.blockchain',
              kyc_additional_data: 'none',
            },
          },
        },
      }),
    },
  );
  console.log(did);
};

export const sendVc = async () => {
  const did = await connector.createIdentity();

  const response = await fetch(
    `http://127.0.0.1:8000/integrations/issuer/v1/public/claims/offers/${
      did.split(':')[2]
    }/IdentityProviders`,
  );
  const offer = await response.json();

  const data = await connector.saveCredentials(offer.data.attributes);

  console.log(data);
};

export const createProof = async () => {
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  const data = await connector.createProof({
    circuitId: 'credentialAtomicQueryMTPV2OnChain',
    accountAddress: accounts[0],
    query: {
      allowedIssuers: ['*'],
      credentialSubject: {
        isNatural: {
          $eq: 1,
        },
      },
      type: 'IdentityProviders',
    },
  });

  console.log(data);
};

export const createBackup = async () => {
  await connector.createBackup();
};

export const recoverBackup = async () => {
  await connector.recoverBackup();
};

export const checkStateContractSync = async () => {
  const isSynced = await connector.checkStateContractSync();

  alert(`State contract is synced: ${isSynced}`);
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');

export const reconnectSnap = async (
  snapId: string,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};
