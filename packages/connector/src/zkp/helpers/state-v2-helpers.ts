/* eslint-disable camelcase */

import type { TransactionRequest } from '@ethersproject/providers';
import { providers, utils } from 'ethers';

import { FetcherError } from '@/helpers/error-helper';
import { sleep } from '@/helpers/promise';
import { CORE_POLLING_INTERVAL } from '@/zkp/consts';
import type {
  StateInfo,
  Operation,
  OperationProof,
  UpdateStateDetails,
  StateProof,
  OperationResponse,
} from '@/zkp/types';
import { StateV2__factory } from '@/zkp/types';
import { LightweightStateV2__factory } from '@/zkp/types/contracts';

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
  targetChainId: number,
  targetStateContractAddress: string,
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
    to: targetStateContractAddress,
    from: accountId,
    chainId: targetChainId,
    data: txData,
  };
};

export const getGISTProof = async ({
  rpcUrl,
  contractAddress,
  userId,
  rootHash,
}: {
  rpcUrl: string;
  contractAddress: string;
  userId: string;
  rootHash?: string;
}): Promise<StateProof> => {
  const rawProvider = new providers.JsonRpcProvider(rpcUrl);

  const contractInstance = StateV2__factory.connect(
    contractAddress,
    rawProvider,
  );

  const data = rootHash
    ? await contractInstance.getGISTProofByRoot(userId, rootHash)
    : await contractInstance.getGISTProof(userId);

  return {
    root: BigInt(data.root.toString()),
    existence: data.existence,
    siblings: data.siblings?.map((sibling) => BigInt(sibling.toString())),
    index: BigInt(data.index.toString()),
    value: BigInt(data.value.toString()),
    auxExistence: data.auxExistence,
    auxIndex: BigInt(data.auxIndex.toString()),
    auxValue: BigInt(data.auxValue.toString()),
  };
};

// getRarimoGISTRoot returns the latest GIST root from the Rarimo state contract
export const getRarimoGISTRoot = async (
  coreRpcUrl: string,
  coreStateContractAddress: string,
): Promise<bigint> => {
  const rawProvider = new providers.JsonRpcProvider(coreRpcUrl, 'any');

  const contractInstance = StateV2__factory.connect(
    coreStateContractAddress,
    rawProvider,
  );

  const root = await contractInstance.getGISTRoot();

  return BigInt(root.toString());
};

// getCurrentChainGISTRoot returns the GIST root from a lightweight state contract deployed on the current chain
export const getCurrentChainGISTRoot = async (
  targetRpcUrl: string,
  targetStateContractAddress: string,
): Promise<bigint> => {
  const provider = new providers.JsonRpcProvider(targetRpcUrl, 'any');

  const contractInstance = LightweightStateV2__factory.connect(
    targetStateContractAddress,
    provider,
  );
  const root = await contractInstance.getGISTRoot();
  return BigInt(root.toString());
};

// checkIfStateSynced returns true if the GIST root from the Rarimo state contract matches the GIST root from the current chain
export const checkIfStateSynced = async (
  coreRpcUrl: string,
  coreStateContractAddress: string,
  targetRpcUrl: string,
  targetStateContractAddress: string,
): Promise<boolean> => {
  /*
    NOTE: for now we assume that the state must be synced if the GIST roots don't match
          some more sophisticated logic could be added here in the future
   */
  const rarimoGISTRoot = await getRarimoGISTRoot(
    coreRpcUrl,
    coreStateContractAddress,
  );

  const currentChainGISTRoot = await getCurrentChainGISTRoot(
    targetRpcUrl,
    targetStateContractAddress,
  );
  return rarimoGISTRoot === currentChainGISTRoot;
};

export const getCoreOperationByIndex = async (
  rarimoApiUrl: string,
  index: string,
) => {
  return loadDataFromRarimoCore<OperationResponse>(
    `/rarimo/rarimo-core/rarimocore/operation/${index}`,
    rarimoApiUrl,
  );
};
