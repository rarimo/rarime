import './polyfill'
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text, divider, heading } from '@metamask/snaps-ui';
import { Identity } from './identity';
import { setItemInStore } from './rpc';
import { StorageKeys } from './enums';
import { W3CCredential } from './types';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'save_credentials': {
      const dialogContent = [
        heading('Credentials'),
        divider(),
      ];

      const credentials = (request.params as any).verifiableCredentials as W3CCredential[]

      const dialogCredentials = credentials.reduce((acc: any, cred: any) => {
        return acc.concat([divider(), text('Credential'), text(JSON.stringify(cred))]);
      }, []);

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([...dialogContent, ...dialogCredentials]),
        },
      });

      if(res) {
        await setItemInStore(StorageKeys.credentials, credentials)
      }
      break
    }
    case 'create_identity': {
      const res =  await snap.request({
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

      if(res) {
        const identity = await Identity.create();
        await setItemInStore(StorageKeys.identity, identity)
        return identity.did
      }
      break
    }
    default:
      throw new Error('Method not found.');
  }
};
