// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text, divider, heading, copyable } from '@metamask/snaps-ui';
import { RPCMethods } from '@rarimo/rarime-connector';
import { DID } from '@iden3/js-iden3-core';
import { Identity } from './identity';
import { getItemFromStore, setItemInStore } from './rpc';
import { CircuitId, StorageKeys } from './enums';
import {
  ClaimOffer,
  CreateProofRequest,
  GetStateInfoResponse,
  MerkleProof,
  TextField,
} from './types';
import { AuthZkp } from './auth-zkp';
import {
  exportKeysAndCredentials,
  findCredentialsByQuery,
  importKeysAndCredentials,
  saveCredentials,
  checkIfStateSynced,
  getUpdateStateTx,
  loadDataFromRarimoCore,
  getProviderChainInfo,
  getHostname,
} from './helpers';
import { ZkpGen } from './zkp-gen';
import {
  isValidSaveCredentialsOfferRequest,
  isValidCreateProofRequest,
} from './typia-generated';
import { GET_CREDENTIALS_SUPPORTED_HOSTNAMES } from './config';

export const onRpcRequest: OnRpcRequestHandler = async ({
  request,
  origin,
}): Promise<unknown> => {
  switch (request.method) {
    case RPCMethods.SaveCredentials: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const offer = (request.params as any) as ClaimOffer;

      isValidSaveCredentialsOfferRequest(offer);

      const dialogContent = [
        heading('Credentials'),
        divider(),
        text(`From: ${offer.from}`),
        text(`Url: ${offer.body.url}`),
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

    case RPCMethods.CreateIdentity: {
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
        const entropy = await snap.request({
          method: 'snap_getEntropy',
          params: { version: 1 },
        });
        const keyHex = entropy.startsWith('0x')
          ? entropy.substring(2)
          : entropy;

        const identity = await Identity.create(keyHex);
        await setItemInStore(StorageKeys.identity, {
          privateKeyHex: identity.privateKeyHex,
          did: identity.didString,
        });

        snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Your RariMe is ready for use!'),
              divider(),
              text('Your unique identifier(DID):'),
              copyable(identity.didString),
            ]),
          },
        });

        return identity.didString;
      }
      throw new Error('User rejected request');
    }

    case RPCMethods.CreateProof: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const params = (request.params as any) as CreateProofRequest;

      isValidCreateProofRequest(params);

      const credentialType = params.query.type;
      const { credentialSubject } = params.query;
      const { circuitId, accountAddress } = params;

      const isOnChainProof =
        circuitId === CircuitId.AtomicQuerySigV2OnChain ||
        circuitId === CircuitId.AtomicQueryMTPV2OnChain;

      if (isOnChainProof && !accountAddress) {
        throw new Error('Account address is required');
      }

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
        const zkpProof = await zkpGen.generateProof();

        if (!isOnChainProof) {
          return { zkpProof };
        }

        let updateStateTx;

        const chainInfo = await getProviderChainInfo();

        const isSynced = await checkIfStateSynced();

        const ID = DID.parse(credentials[0].issuer).id;
        const issuerHexId = `0x0${ID.bigInt().toString(16)}`;

        const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
          `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
        );
        const merkleProof = await loadDataFromRarimoCore<MerkleProof>(
          `/rarimo/rarimo-core/identity/state/${issuerHexId}/proof`,
          stateData.state.createdAtBlock,
        );

        if (!isSynced) {
          updateStateTx = await getUpdateStateTx(
            accountAddress!,
            chainInfo,
            stateData.state,
          );
        }

        return {
          statesMerkleData: {
            issuerId: issuerHexId,
            state: stateData.state,
            merkleProof: merkleProof.proof,
          },
          zkpProof,
          ...(updateStateTx && { updateStateTx }),
        };
      }
      throw new Error('User rejected request');
    }

    case RPCMethods.CreateBackup: {
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

    case RPCMethods.RecoverBackup: {
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

    case RPCMethods.CheckStateContractSync: {
      const isSynced = await checkIfStateSynced();

      return isSynced;
    }

    case RPCMethods.GetCredentials: {
      if (!GET_CREDENTIALS_SUPPORTED_HOSTNAMES.includes(getHostname(origin))) {
        throw new Error('This origin does not have access to credentials');
      }
      return (await getItemFromStore(StorageKeys.credentials)) || [];
    }

    default:
      throw new Error('Method not found.');
  }
};
