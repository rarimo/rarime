import type { JsonRpcRequest } from '@metamask/utils';
import {
  CircuitId,
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import { DID } from '@iden3/js-iden3-core';
import { snapStorage } from '@/helpers';
import { StorageKeys } from '@/enums';
import { isValidCreateProofRequest } from '@/typia-generated';
import {
  checkIfStateSynced,
  getCoreOperationByIndex,
  getProviderChainInfo,
  getRarimoCoreUrl,
  loadDataFromRarimoCore,
  parseDidV2,
  VCManager,
} from '@/zkp/helpers';
import { TextField } from '@/types';
import { Identity } from '@/zkp/identity';
import { ZkpGen } from '@/zkp/zkp-gen';
import { GetStateInfoResponse, MerkleProof } from '@/zkp/types';

export const createProof = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.CreateProof]> => {
  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

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

  if (!res) {
    throw new Error('User rejected request');
  }

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
};
