// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text, divider, heading, copyable } from '@metamask/snaps-ui';
import { Identity } from './identity';
import { getItemFromStore, setItemInStore } from './rpc';
import { StorageKeys } from './enums';
import { ClaimOffer, CreateProofRequest, TextField } from './types';
import { AuthZkp } from './auth-zkp';
import {
  exportKeysAndCredentials,
  findCredentialsByQuery,
  importKeysAndCredentials,
  saveCredentials,
} from './helpers';
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

        snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Identity info'),
              divider(),
              text('Private key:'),
              copyable(identity.privateKeyHex),
              text('DID:'),
              copyable(identity.didString),
            ]),
          },
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

      const credentialType = params.query.type;
      const { credentialSubject } = params.query;
      const { circuitId } = params;

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Create proof'),
            ...(credentialType
              ? [divider(), text('Credential type'), text(credentialType)]
              : []),
            ...(credentialSubject
              ? [
                  divider(),
                  text('Requirements'),
                  ...Object.keys(credentialSubject).reduce(
                    (acc: TextField[], fieldName) => {
                      const fieldOperators = credentialSubject?.[fieldName];
                      const textField = Object.keys(fieldOperators).map(
                        (operator) => {
                          return text(
                            `${fieldName} - ${operator} ${fieldOperators[operator]}\n`,
                          );
                        },
                      );
                      return acc.concat(textField);
                    },
                    [],
                  ),
                ]
              : []),
            ...(circuitId
              ? [divider(), text('Proof type'), text(circuitId)]
              : []),
          ]),
        },
      });

      if (res) {
        const identity = await Identity.create(identityStorage.privateKeyHex);

        const zkpGen = new ZkpGen(identity, params, credentials[0]);
        return await zkpGen.generateProof();
      }
      throw new Error('User rejected request');
    }

    case 'create_backup': {
      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Export keys and credentials'),
            divider(),
            text('Backup provides full access to your snap'),
            text('Do not share this with anyone'),
            text('Make sure no one is looking at your screen'),
            divider(),
            text('Would you like to export keys and credentials?'),
          ]),
        },
      });

      if (res) {
        const data = await exportKeysAndCredentials();

        snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Keys and credentials'),
              divider(),
              copyable(data),
            ]),
          },
        });

        return true;
      }
      throw new Error('User rejected request');
    }

    case 'recover_backup': {
      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: panel([
            heading('Recover your identity and credentials'),
            divider(),
            text('Your current identity will be overwritten!'),
            divider(),
            text('Enter your JSON string from the backup here:'),
          ]),
          placeholder: 'Backup data',
        },
      });

      if (res !== null) {
        await importKeysAndCredentials(JSON.parse(res as string));
        return true;
      }
      throw new Error('User rejected request');
    }

    default:
      throw new Error('Method not found.');
  }
};
