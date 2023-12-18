// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';
import { RPCMethods } from '@rarimo/rarime-connector';
import { DID } from '@iden3/js-iden3-core';
import type { JsonRpcRequest } from '@metamask/utils';
import { Identity } from './identity';
import { getItemFromStore, setItemInStore } from './rpc';
import { CircuitId, StorageKeys } from './enums';
import {
  ClaimOffer,
  CreateProofRequestParams,
  GetStateInfoResponse,
  MerkleProof,
  TextField,
} from './types';
import { AuthZkp } from './auth-zkp';
import {
  checkIfStateSynced,
  getCoreOperationByIndex,
  getHostname,
  getProviderChainInfo,
  getRarimoCoreUrl,
  loadDataFromRarimoCore,
  moveStoreVCtoCeramic,
  VCManager,
} from './helpers';
import { ZkpGen } from './zkp-gen';
import {
  isValidCreateProofRequest,
  isValidSaveCredentialsOfferRequest,
} from './typia-generated';
import { GET_CREDENTIALS_SUPPORTED_HOSTNAMES } from './config';

export const onRpcRequest = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}) => {
  if (request.method !== RPCMethods.CreateIdentity) {
    await moveStoreVCtoCeramic();
  }

  switch (request.method) {
    case RPCMethods.SaveCredentials: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const offer = (request.params as any) as ClaimOffer;

      console.log('offer', offer);

      isValidSaveCredentialsOfferRequest(offer);

      const dialogContent = [
        heading('Credentials'),
        divider(),
        text(`From: ${offer.from}`),
        text(`Url: ${offer.body.url}`),
      ];

      console.log('dialogContent', dialogContent);

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

      if (res) {
        const vcManager = await VCManager.create(identityStorage.privateKeyHex);

        const existingVC = await vcManager.getDecryptedVCsByOffer(offer);

        if (existingVC.length) {
          return existingVC;
        }

        const identity = await Identity.create(identityStorage.privateKeyHex);
        console.log('identity', identity);
        const authProof = new AuthZkp(identity, offer);
        console.log('authProof', authProof);
        const credentials = await authProof.getVerifiableCredentials();
        console.log('credentials', credentials);
        await Promise.all(
          credentials.map(async (credential) => {
            await vcManager.encryptAndSaveVC(credential);
          }),
        );
        return credentials;
      }
      throw new Error('User rejected request');
    }

    case RPCMethods.CreateIdentity: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (
        identityStorage?.did ??
        // FIXME: temp
        (identityStorage?.did.includes('readonly') &&
          identityStorage?.didBigInt)
      ) {
        return {
          identityIdString: identityStorage.did,
          identityIdBigIntString: identityStorage.didBigInt,
        };
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
          didBigInt: identity.identityIdBigIntString,
        });

        await snap.request({
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

        return {
          identityIdString: identity.didString,
          identityIdBigIntString: identity.identityIdBigIntString,
        };
      }
      throw new Error('User rejected request');
    }

    case RPCMethods.CreateProof: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const vcManager = await VCManager.create(identityStorage.privateKeyHex);

      const params = (request.params as any) as CreateProofRequestParams;

      const { issuerDid, ...createProofRequest } = params;

      isValidCreateProofRequest(createProofRequest);

      const credentialType = createProofRequest.query.type;
      const { credentialSubject } = createProofRequest.query;
      const { circuitId, accountAddress } = createProofRequest;

      const isOnChainProof =
        circuitId === CircuitId.AtomicQuerySigV2OnChain ||
        circuitId === CircuitId.AtomicQueryMTPV2OnChain;

      if (isOnChainProof && !accountAddress) {
        throw new Error('Account address is required');
      }

      const credentials = (
        await vcManager.getDecryptedVCsByQuery(
          createProofRequest.query,
          issuerDid,
        )
      ).filter((cred) => {
        const splittedCredSubjId = String(cred.credentialSubject.id).split(':');

        const splittedIdentityStorageDid = identityStorage.did.split(':');

        return (
          splittedCredSubjId[splittedCredSubjId.length - 1] ===
          splittedIdentityStorageDid[splittedIdentityStorageDid.length - 1]
        );
      });

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

        const zkpGen = new ZkpGen(identity, createProofRequest, credentials[0]);

        // ================ LOAD STATE DETAILS  =====================

        const chainInfo = await getProviderChainInfo();

        const rarimoCoreUrl = getRarimoCoreUrl(chainInfo.id);

        const isSynced = await checkIfStateSynced();

        const did = DID.parse(
          credentials[0].issuer.replace('iden3:', 'iden3:readonly:'),
        );

        const issuerId = DID.idFromDID(did);

        const issuerHexId = `0x0${issuerId.bigInt().toString(16)}`;

        const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
          `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
        );
        const merkleProof = await loadDataFromRarimoCore<MerkleProof>(
          `/rarimo/rarimo-core/identity/state/${issuerHexId}/proof`,
          stateData.state.createdAtBlock,
        );

        const operation = await getCoreOperationByIndex(
          stateData.state.lastUpdateOperationIndex,
        );

        // ================== USE STATE DETAILS TO GEN PROOF =====================

        const zkpProof = await zkpGen.generateProof(
          stateData.state.hash,
          operation.operation.details.GISTHash,
        );

        return {
          chainInfo,
          rarimoCoreUrl,
          isSynced,

          issuerHexId,

          stateData: stateData.state,
          merkleProof,
          operation: operation.operation,

          zkpProof,
        };
      }
      throw new Error('User rejected request');
    }

    case RPCMethods.CheckStateContractSync: {
      return await checkIfStateSynced();
    }

    case RPCMethods.GetCredentials: {
      if (!GET_CREDENTIALS_SUPPORTED_HOSTNAMES.includes(getHostname(origin))) {
        throw new Error('This origin does not have access to credentials');
      }

      const vcManager = await VCManager.create();

      return await vcManager.getAllDecryptedVCs();
    }

    default:
      throw new Error('Method not found.');
  }
};
