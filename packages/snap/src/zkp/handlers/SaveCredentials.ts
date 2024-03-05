import type { JsonRpcRequest } from '@metamask/utils';
import {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import { snapStorage } from '@/helpers';
import { StorageKeys } from '@/enums';
import { isValidSaveCredentialsOfferRequest } from '@/typia-generated';
import { VCManager } from '@/zkp/helpers';
import { Identity } from '@/zkp/identity';
import { AuthZkp } from '@/zkp/auth-zkp';

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

  const identity = await Identity.create(identityStorage.privateKeyHex);

  const authProof = new AuthZkp(identity, offer);

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
