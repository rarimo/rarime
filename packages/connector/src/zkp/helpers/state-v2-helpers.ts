/* eslint-disable camelcase */

import type { TransactionRequest } from '@ethersproject/providers';
import { utils } from 'ethers';

import { LightweightStateV2__factory } from '../contracts';

import { FetcherError } from '@/helpers/error-helper';
import { sleep } from '@/helpers/promise';
import { CORE_POLLING_INTERVAL } from '@/zkp';
import type {
  RarimoChainInfo,
  StateInfo,
  Operation,
  OperationProof,
  UpdateStateDetails,
} from '@/zkp';

export const loadDataFromRarimoCore = async <T>(
  url: string,
  rarimoCoreUrl: string,
  blockHeight?: string,
): Promise<T> => {
  const response = await fetch(`${rarimoCoreUrl}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(blockHeight && { 'X-Cosmos-Block-Height': blockHeight }),
    },
  });

  if (!response.ok) {
    throw new FetcherError(response);
  }

  return await response.json();
};

export const getUpdateStateDetails = async (
  state: StateInfo,
  operation: Operation,
  rarimoCoreUrl: string,
): Promise<UpdateStateDetails> => {
  let operationProof;
  do {
    try {
      operationProof = await loadDataFromRarimoCore<OperationProof>(
        `/rarimo/rarimo-core/rarimocore/operation/${state.lastUpdateOperationIndex}/proof`,
        rarimoCoreUrl,
      );
    } catch (error) {
      if (error instanceof FetcherError && error.response.status === 400) {
        await sleep(CORE_POLLING_INTERVAL);
      } else {
        throw error;
      }
    }
  } while (!operationProof);

  const decodedPath = operationProof.path.map((el: string) =>
    utils.arrayify(el),
  );
  const decodedSignature = operationProof.signature
    ? utils.arrayify(operationProof.signature)
    : undefined;

  if (!decodedSignature) {
    throw new Error('Signature is not defined');
  }

  if (decodedSignature[64] !== undefined) {
    decodedSignature[64] += 27;
  }

  const proof = utils.defaultAbiCoder.encode(
    ['bytes32[]', 'bytes'],
    [decodedPath, decodedSignature],
  );

  return {
    stateRootHash: operation.details.stateRootHash,
    gistRootDataStruct: {
      root: operation.details.GISTHash,
      createdAtTimestamp: Number(operation.details.timestamp),
    },
    proof,
  };
};

export const getUpdateStateTx = async (
  accountId: string,
  chainInfo: RarimoChainInfo,
  state: StateInfo,
  operation: Operation,
  rarimoCoreUrl: string,
  updateStateDetails?: UpdateStateDetails,
): Promise<TransactionRequest> => {
  const { stateRootHash, gistRootDataStruct, proof } =
    updateStateDetails ??
    (await getUpdateStateDetails(state, operation, rarimoCoreUrl));

  const contractInterface = LightweightStateV2__factory.createInterface();

  const txData = contractInterface.encodeFunctionData('signedTransitState', [
    stateRootHash,
    gistRootDataStruct,
    proof,
  ]);
  return {
    to: chainInfo.stateContractAddress,
    from: accountId,
    chainId: chainInfo.id,
    data: txData,
  };
};
