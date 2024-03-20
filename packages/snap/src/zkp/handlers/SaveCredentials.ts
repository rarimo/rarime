import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { AuthZkp, Identity } from '@rarimo/zkp-iden3';

import { config } from '@/config';
import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import { isValidSaveCredentialsOfferRequest } from '@/typia-generated';
import {
  getProviderChainInfo,
  getSnapFileBytes,
  VCManager,
} from '@/zkp/helpers';

export const saveCredentials = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.SaveCredentials]> => {
  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  if (!identityStorage) {
    throw new Error('Identity not created');
  }

  // FIXME: mb multiple offers?
  const offer = request.params as SnapRequestParams[RPCMethods.SaveCredentials];

  isValidSaveCredentialsOfferRequest(offer);

  const dialogContent = [
    heading('Credentials'),
    divider(),
    text(`From: ${offer.from}`),
    text(`Url: ${offer.body.url}`),
  ];

  const dialogCredentials = offer.body.Credentials.reduce(
    (acc: any, cred: any) => {
      return acc.concat([divider(), text(cred.description), text(cred.id)]);
    },
    [],
  );

  const res = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([...dialogContent, ...dialogCredentials]),
    },
  });

  if (!res) {
    throw new Error('User rejected request');
  }

  const vcManager = await VCManager.create();

  const identity = await Identity.create(
    {
      schemaHashHex: config.AUTH_BJJ_CREDENTIAL_HASH,
      idType: config.ID_TYPE,
    },
    identityStorage.privateKeyHex,
  );

  const chainInfo = await getProviderChainInfo();

  const authProof = new AuthZkp(identity, offer, {
    chainInfo,
    loadingCircuitCb: getSnapFileBytes,
    circuitsUrls: {
      wasmUrl: config.CIRCUIT_AUTH_WASM_URL,
      keyUrl: config.CIRCUIT_AUTH_FINAL_KEY_URL,
    },
  });

  const credentials = await authProof.getVerifiableCredentials();

  await Promise.all(
    credentials.map(async (credential) => {
      await vcManager.clearMatchedVcs(credential);
      await vcManager.encryptAndSaveVC(credential);
    }),
  );

  return credentials.map((cred) => ({
    type: cred.type,
    issuer: cred.issuer,
  }));
};
