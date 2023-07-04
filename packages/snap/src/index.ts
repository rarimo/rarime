// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text, divider, heading } from '@metamask/snaps-ui';
import { Identity } from './identity';
import { setItemInStore } from './rpc';
import { StorageKeys } from './enums';
import { W3CCredential } from './types';

export const onRpcRequest: OnRpcRequestHandler = async ({
  request,
}): Promise<unknown> => {
  switch (request.method) {
    case 'save_credentials': {
      const dialogContent = [heading('Credentials'), divider()];

      const credentials = (request.params as any)
        .verifiableCredentials as W3CCredential[];

      const dialogCredentials = credentials.reduce((acc: any, cred: any) => {
        return acc.concat([
          divider(),
          text('Credential'),
          text(JSON.stringify(cred)),
        ]);
      }, []);

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([...dialogContent, ...dialogCredentials]),
        },
      });

      if (res) {
        await setItemInStore(StorageKeys.credentials, credentials);
      }
      break;
    }

    case 'create_identity': {
      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Identity creation'),
            divider(),
            text(`You have not identity`),
            text(`Would you like to create?`),
          ]),
        },
      });

      if (res) {
        const identity = await Identity.create(
          'b3f3fa62c914285a91ef9a365daf28aac16de58bd173b90ef003b0b32abb301c',
        );
        console.log(identity.identityIdString);
        await setItemInStore(StorageKeys.identity, identity);
        return identity.did;
      }
      break;
    }
    default:
      throw new Error('Method not found.');
  }
  return Promise.resolve();
};
