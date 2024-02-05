// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-sdk';
import {
  CheckCredentialExistenceRequestParams,
  RPCMethods,
  SaveCredentialsResponse,
} from '@rarimo/rarime-connector';
import { DID } from '@iden3/js-iden3-core';
import type { JsonRpcRequest } from '@metamask/utils';
import { Identity } from './identity';
import { getItemFromStore, setItemInStore } from './rpc';
import { CircuitId, StorageKeys } from './enums';
import {
  SaveCredentialsRequestParams,
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
  isDidSupported,
  loadDataFromRarimoCore,
  migrateVCsToLastCeramicModel,
  parseDidV2,
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
    await migrateVCsToLastCeramicModel();
  }

  switch (request.method) {
    case RPCMethods.CheckCredentialExistence: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const {
        claimOffer,
        proofRequest,
      } = request.params as CheckCredentialExistenceRequestParams;

      const vcManager = await VCManager.create();

      let result: SaveCredentialsResponse[] = [];

      if (claimOffer && proofRequest) {
        const vcs = await vcManager.getDecryptedVCsByOfferAndQuery(
          claimOffer,
          proofRequest,
        );

        result = vcs?.map((vc) => ({
          type: vc.type,
          issuer: vc.issuer,
        }));
      } else if (claimOffer) {
        const vcs = await vcManager.getDecryptedVCsByOffer(claimOffer);

        result = vcs?.map((vc) => ({
          type: vc.type,
          issuer: vc.issuer,
        }));
      } else if (proofRequest) {
        const vcs = await vcManager.getDecryptedVCsByQuery(
          proofRequest.query,
          proofRequest.issuerDid,
        );

        result = vcs?.map((vc) => ({
          type: vc.type,
          issuer: vc.issuer,
        }));
      }

      return result;
    }

    case RPCMethods.SaveCredentials: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);
      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const offer = (request.params as any) as SaveCredentialsRequestParams;

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

      if (res) {
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
      }
      throw new Error('User rejected request');
    }

    case RPCMethods.CreateIdentity: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (
        identityStorage?.did &&
        identityStorage?.didBigInt &&
        isDidSupported(identityStorage.did)
      ) {
        return {
          identityIdString: identityStorage.did,
          identityIdBigIntString: identityStorage.didBigInt,
        };
      }

      const res =
        Boolean(identityStorage?.did && identityStorage?.didBigInt) ||
        (await snap.request({
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
        }));

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

      const params = request.params as CreateProofRequestParams;

      const { issuerDid, ...createProofRequest } = params;

      isValidCreateProofRequest(createProofRequest);

      const { query } = createProofRequest;
      const { circuitId, accountAddress } = createProofRequest;

      const isOnChainProof =
        circuitId === CircuitId.AtomicQuerySigV2OnChain ||
        circuitId === CircuitId.AtomicQueryMTPV2OnChain;

      if (isOnChainProof && !accountAddress) {
        throw new Error('Account address is required');
      }

      const vcManager = await VCManager.create();

      const credentials = (
        await vcManager.getDecryptedVCsByQuery(query, issuerDid)
      ).filter((cred) => {
        const CredSubjId = parseDidV2(cred.credentialSubject.id as string);

        const IdentityStorageDid = parseDidV2(identityStorage.did);

        return CredSubjId.string() === IdentityStorageDid.string();
      });

      if (!credentials.length) {
        throw new Error(
          `no credential were issued on the given id ${identityStorage.did}`,
        );
      }

      const vc = credentials[0];

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Generate a zero-knowledge proof?'),

            divider(),

            text('**Credential**'),
            text(`${vc.type?.[1]}\n`),

            divider(),
            text('**Query**'),

            ...(query.credentialSubject
              ? Object.keys(query.credentialSubject).reduce(
                  (accSubj: TextField[], fieldName) => {
                    const fieldOperators = query.credentialSubject?.[fieldName];

                    const isString = typeof fieldOperators === 'string';
                    const isNumber = typeof fieldOperators === 'number';

                    if (isString || isNumber) {
                      return accSubj.concat(
                        text(`${fieldName} - ${fieldOperators}\n`),
                      );
                    }

                    const textField = Object.keys(fieldOperators).map(
                      (operator) => {
                        return text(
                          `${fieldName} - ${operator} ${
                            (fieldOperators as any)?.[operator]
                          }\n`,
                        );
                      },
                    );

                    return accSubj.concat(textField);
                  },
                  [],
                )
              : []),

            divider(),

            ...(circuitId ? [text('**ZK Circuit**'), text(circuitId)] : []),
          ]),
        },
      });

      if (res) {
        const identity = await Identity.create(identityStorage.privateKeyHex);

        const zkpGen = new ZkpGen(identity, createProofRequest, vc);

        // ================ LOAD STATE DETAILS  =====================

        const chainInfo = await getProviderChainInfo();

        const rarimoCoreUrl = getRarimoCoreUrl(chainInfo.id);

        const isSynced = await checkIfStateSynced();

        const did = parseDidV2(issuerDid);

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
