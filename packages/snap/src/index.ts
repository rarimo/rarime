// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text, divider, heading } from '@metamask/snaps-ui';
import { Identity } from './identity';
import { getItemFromStore, setItemInStore } from './rpc';
import { StorageKeys } from './enums';
import { ClaimOffer, CreateProofRequest } from './types';
import { AuthZkp } from './auth-zkp';
import { findCredentialsByQuery, saveCredentials } from './helpers';
import { ZkpGen } from './zkp-gen';

export const onRpcRequest: OnRpcRequestHandler = async ({
  request,
}): Promise<unknown> => {
  switch (request.method) {
    case 'save_credentials': {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const offer = request.params as any as ClaimOffer;

      const dialogContent = [
        heading('Credentials'),
        divider(),
        text(`From: ${offer.from}`),
      ];

      const dialogCredentials = offer.body.credentials.reduce(
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

      if (res) {
        const identity = await Identity.create(identityStorage.privateKeyHex);
        const authProof = new AuthZkp(identity, offer);
        const credentials = await authProof.getVerifiableCredentials();
        await saveCredentials(credentials);
        return credentials;
      }
      throw new Error('User rejected request');
    }

    case 'create_identity': {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (identityStorage) {
        return identityStorage.did;
      }

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Identity creation'),
            divider(),
            text(`You don't have an identity yet`),
            text('Would you like to create?'),
          ]),
        },
      });

      if (res) {
        const identity = await Identity.create();
        await setItemInStore(StorageKeys.identity, {
          privateKeyHex: identity.privateKeyHex,
          did: identity.didString,
        });
        return identity.didString;
      }
      throw new Error('User rejected request');
    }

    case 'create_proof': {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const params = request.params as any as CreateProofRequest;

      const credentials = (await findCredentialsByQuery(params.query)).filter(
        (cred) => cred.credentialSubject.id === identityStorage.did,
      );

      if (!credentials.length) {
        throw new Error(
          `no credential were issued on the given id ${identityStorage.did}`,
        );
      }

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Create proof'),
            divider(),
            text(`Would you like to create?`),
          ]),
        },
      });

      if (res) {
        const identity = await Identity.create(identityStorage.privateKeyHex);

        const zkpGen = new ZkpGen(identity, credentials[0]);
        return await zkpGen.generateProof();
      }
      throw new Error('User rejected request');
    }
    default:
      throw new Error('Method not found.');
  }
};
