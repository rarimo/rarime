// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import {
  copyable,
  divider,
  heading,
  panel,
  text,
  Component,
} from '@metamask/snaps-sdk';
import {
  RPCMethods,
  SaveCredentialsResponse,
  SnapRequestParams,
  CircuitId,
} from '@rarimo/rarime-connector';
import { DID } from '@iden3/js-iden3-core';
import type { JsonRpcRequest } from '@metamask/utils';
import { utils } from 'ethers';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Identity } from './identity';
import { getItemFromStore, setItemInStore } from './rpc';
import { StorageKeys } from './enums';
import { GetStateInfoResponse, MerkleProof, TextField } from './types';
import { AuthZkp } from './auth-zkp';
import {
  checkIfStateSynced,
  genPkHexFromEntropy,
  getClaimIdFromVCId,
  getCoreOperationByIndex,
  getProviderChainInfo,
  getRarimoCoreUrl,
  isDidSupported,
  isOriginInWhitelist,
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

import {
  addChain,
  generateWallet,
  getAllChains,
  getChainDetails,
  parser,
  validateChain,
  validateChainId,
} from './wallet';
import { getChainPanel } from './wallet/ui';

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
      } = request.params as SnapRequestParams[RPCMethods.CheckCredentialExistence];

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

    case RPCMethods.RemoveCredentials: {
      if (!isOriginInWhitelist(origin)) {
        throw new Error(
          'This origin does not have access to the RemoveCredentials method',
        );
      }

      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const params = request.params as SnapRequestParams[RPCMethods.RemoveCredentials];

      const claimIds = params.ids.map((id) => getClaimIdFromVCId(id));

      const vcManager = await VCManager.create();

      const vcs = await vcManager.getDecryptedVCsByClaimIds(claimIds);

      const res = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Remove Credentials'),
            divider(),

            ...vcs.reduce((acc, el, idx) => {
              const vcTargetType = el.type[1];
              const vcID = el.id;

              return acc.concat([
                text(`**Credential #${idx + 1}**`),
                text(`Type: ${vcTargetType}`),
                text(`ID: ${vcID}`),
                divider(),
              ]);
            }, [] as Component[]),
          ]),
        },
      });

      if (!res) {
        throw new Error('User rejected request');
      }

      await Promise.all(vcs.map((vc) => vcManager.clearMatchedVcs(vc)));

      return undefined;
    }

    case RPCMethods.SaveCredentials: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);

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

      const params = request.params as SnapRequestParams[RPCMethods.CreateIdentity];

      if (
        params?.privateKeyHex &&
        !utils.isHexString(`0x${params?.privateKeyHex}`)
      ) {
        throw new Error('Invalid private key');
      }

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
              text('Would you like to create one?'),
            ]),
          },
        }));

      if (!res) {
        throw new Error('User rejected request');
      }

      const identity = await Identity.create(
        params?.privateKeyHex || (await genPkHexFromEntropy()),
      );

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

    case RPCMethods.GetIdentity: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      return {
        identityIdString: identityStorage.did,
        identityIdBigIntString: identityStorage.didBigInt,
      };
    }

    case RPCMethods.CreateProof: {
      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (!identityStorage) {
        throw new Error('Identity not created');
      }

      const {
        issuerDid,
        ...createProofRequest
      } = request.params as SnapRequestParams[RPCMethods.CreateProof];

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
      if (!isOriginInWhitelist(origin)) {
        throw new Error('This origin does not have access to credentials');
      }

      const vcManager = await VCManager.create();

      return await vcManager.getAllDecryptedVCs();
    }

    case RPCMethods.ExportIdentity: {
      if (!isOriginInWhitelist(origin)) {
        throw new Error('This origin does not have access to export identity');
      }

      const identityStorage = await getItemFromStore(StorageKeys.identity);

      if (!identityStorage.privateKeyHex) {
        throw new Error('Identity not created');
      }

      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            heading('Your RariMe private key'),
            divider(),
            text('Сopy:'),
            copyable(identityStorage.privateKeyHex),
          ]),
        },
      });
    }

    // WALLET

    case RPCMethods.WalletSignDirect: {
      const params = (request.params as unknown) as SnapRequestParams[RPCMethods.WalletSignDirect];

      const panels = parser.parse(params.signDoc, origin, 'direct');
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel(panels),
        },
      });

      if (!confirmed) {
        throw new Error('User denied transaction');
      }

      const { signerAddress, signDoc } = params;
      await validateChainId(signDoc.chainId);
      // const { low, high, unsigned } = signDoc.accountNumber;
      const chainDetails = await getChainDetails(signDoc.chainId);
      const wallet = await generateWallet(chainDetails);

      // const accountNumber = new Long(low, high, unsigned);
      const sd: SignDoc = {
        bodyBytes: new Uint8Array(Object.values(signDoc.bodyBytes)),
        authInfoBytes: new Uint8Array(Object.values(signDoc.authInfoBytes)),
        chainId: signDoc.chainId,
        accountNumber: signDoc.accountNumber,
      };
      return await wallet.signDirect(signerAddress, sd);
    }

    case RPCMethods.WalletSignAmino: {
      const params = (request.params as unknown) as SnapRequestParams[RPCMethods.WalletSignAmino];
      const panels = parser.parse(params.signDoc, origin, 'amino');

      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel(panels),
        },
      });
      if (!confirmed) {
        throw new Error('User denied transaction');
      }

      const { signerAddress, signDoc } = params;

      const receivedChainId =
        params.chainId || signDoc.chain_id || signDoc.chainId || '';

      if (!receivedChainId) {
        throw new Error('ChainId is mandatory params');
      }

      if (!params.isADR36) {
        await validateChainId(receivedChainId);
      }

      const chainDetails = await getChainDetails(receivedChainId);

      const wallet = await generateWallet(chainDetails);

      const defaultFee = signDoc.fee;
      const defaultMemo = signDoc.memo;

      const sortedSignDoc = {
        chain_id: receivedChainId,
        account_number: signDoc.account_number ?? signDoc.accountNumber,
        sequence: signDoc.sequence,
        fee: defaultFee,
        memo: defaultMemo,
        msgs: signDoc.msgs,
      };
      return await wallet.signAmino(signerAddress, sortedSignDoc, {
        extraEntropy: params.enableExtraEntropy
          ? params.enableExtraEntropy
          : false,
      });
    }

    case RPCMethods.WalletGetKey: {
      const {
        chainId,
      } = request.params as SnapRequestParams[RPCMethods.WalletGetKey];
      await validateChainId(chainId);
      const chainDetails = await getChainDetails(chainId);
      const wallet = await generateWallet(chainDetails);
      const accounts = wallet.getAccounts();
      return {
        address: accounts[0].address,
        algo: 'secp256k1',
        bech32Address: accounts[0].address,
        isNanoLedger: false,
        name: 'Cosmos',
        pubkey: new Uint8Array(Object.values(accounts[0].pubkey)),
      };
    }

    case RPCMethods.WalletSuggestChain: {
      const {
        chainInfo,
      } = request.params as SnapRequestParams[RPCMethods.WalletSuggestChain];
      validateChain(chainInfo);
      const panels = getChainPanel(origin, chainInfo);
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel(panels),
        },
      });
      if (!confirmed) {
        throw new Error('User denied transaction');
      }

      await addChain(chainInfo);
      return { message: 'Successfully added chain', chainInfo };
    }

    case RPCMethods.WalletGetSupportedChains: {
      return await getAllChains();
    }

    default:
      throw new Error('Method not found.');
  }
};
