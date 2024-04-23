import { DID } from '@iden3/js-iden3-core';
import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import {
  checkIfStateSynced,
  getCoreOperationByIndex,
  CircuitId,
  loadDataFromRarimoCore,
} from '@rarimo/rarime-connector';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
  GetStateInfoResponse,
  MerkleProof,
} from '@rarimo/rarime-connector';
import { ZkpGen, Identity, parseDidV2 } from '@rarimo/zkp-iden3';

import { config } from '@/config';
import { StorageKeys } from '@/enums';
import { getChains, snapStorage } from '@/helpers';
import type { TextField } from '@/types';
import { isValidCreateProofRequest } from '@/typia-generated';
import { getSnapFileBytes, VCManager } from '@/zkp/helpers';

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

  const [rarimoChainId, targetChainId, { issuerDid, ...createProofRequest }] =
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

  const identity = await Identity.create(
    {
      schemaHashHex: config.AUTH_BJJ_CREDENTIAL_HASH,
      idType: config.ID_TYPE,
    },
    identityStorage.privateKeyHex,
  );

  const { rarimoChain, targetChain } = await getChains(
    rarimoChainId,
    targetChainId,
  );

  const zkpGen = new ZkpGen(identity, createProofRequest, vc, {
    coreEvmRpcApiUrl: rarimoChain.rpcEvm,
    coreStateContractAddress: rarimoChain.stateContractAddress,
    loadingCircuitCb: getSnapFileBytes,
    circuitsUrls: {
      [CircuitId.AtomicQuerySigV2]: {
        wasmUrl: config.CIRCUIT_SIG_V2_WASM_URL,
        keyUrl: config.CIRCUIT_SIG_V2_FINAL_KEY_URL,
      },
      [CircuitId.AtomicQueryMTPV2]: {
        wasmUrl: config.CIRCUIT_MTP_V2_WASM_URL,
        keyUrl: config.CIRCUIT_MTP_V2_FINAL_KEY_URL,
      },
      [CircuitId.AtomicQuerySigV2OnChain]: {
        wasmUrl: config.CIRCUIT_SIG_V2_ON_CHAIN_WASM_URL,
        keyUrl: config.CIRCUIT_SIG_V2_ON_CHAIN_FINAL_KEY_URL,
      },
      [CircuitId.AtomicQueryMTPV2OnChain]: {
        wasmUrl: config.CIRCUIT_MTP_V2_ON_CHAIN_WASM_URL,
        keyUrl: config.CIRCUIT_MTP_V2_ON_CHAIN_FINAL_KEY_URL,
      },
    },
  });

  // ================ LOAD STATE DETAILS  =====================

  const isSynced = await checkIfStateSynced(
    rarimoChain.rpcEvm,
    rarimoChain.stateContractAddress,
    targetChain.targetRpcUrl,
    targetChain.targetStateContractAddress,
  );

  const did = parseDidV2(issuerDid);

  const issuerId = DID.idFromDID(did);

  const issuerHexId = `0x0${issuerId.bigInt().toString(16)}`;

  const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
    `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
    rarimoChain.rest,
  );
  const merkleProof = await loadDataFromRarimoCore<MerkleProof>(
    `/rarimo/rarimo-core/identity/state/${issuerHexId}/proof`,
    rarimoChain.rest,
    stateData.state.createdAtBlock,
  );

  const operation = await getCoreOperationByIndex(
    rarimoChain.rest,
    stateData.state.lastUpdateOperationIndex,
  );

  // ================== USE STATE DETAILS TO GEN PROOF =====================

  const zkpProof = await zkpGen.generateProof(
    stateData.state.hash,
    operation.operation.details.GISTHash,
  );

  return {
    isSynced,

    issuerHexId,

    stateData: stateData.state,
    merkleProof,
    operation: operation.operation,

    zkpProof,
  };
};
