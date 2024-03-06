import { DID } from '@iden3/js-iden3-core';
import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';
import { CircuitId } from '@rarimo/rarime-connector';
import type { GetStateInfoResponse, MerkleProof } from '@rarimo/zkp-iden3';
import {
  ZkpGen,
  Identity,
  checkIfStateSynced,
  getCoreOperationByIndex,
  getRarimoCoreUrl,
  loadDataFromRarimoCore,
  parseDidV2,
} from '@rarimo/zkp-iden3';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import type { TextField } from '@/types';
import { isValidCreateProofRequest } from '@/typia-generated';
import {
  getSnapFileBytes,
  VCManager,
  getProviderChainInfo,
} from '@/zkp/helpers';

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

  const { issuerDid, ...createProofRequest } =
    request.params as SnapRequestParams[RPCMethods.CreateProof];

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
                      `${fieldName} - ${operator} ${fieldOperators?.[operator]}\n`,
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

  const chainInfo = await getProviderChainInfo();

  const zkpGen = new ZkpGen(identity, createProofRequest, vc, {
    chainId: chainInfo.id,
    loadingCircuitCb: getSnapFileBytes,
  });

  // ================ LOAD STATE DETAILS  =====================

  const rarimoCoreUrl = getRarimoCoreUrl(chainInfo.id);

  const isSynced = await checkIfStateSynced(chainInfo.id);

  const did = parseDidV2(issuerDid);

  const issuerId = DID.idFromDID(did);

  const issuerHexId = `0x0${issuerId.bigInt().toString(16)}`;

  const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
    chainInfo.id,
    `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
  );
  const merkleProof = await loadDataFromRarimoCore<MerkleProof>(
    chainInfo.id,
    `/rarimo/rarimo-core/identity/state/${issuerHexId}/proof`,
    stateData.state.createdAtBlock,
  );

  const operation = await getCoreOperationByIndex(
    chainInfo.id,
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
