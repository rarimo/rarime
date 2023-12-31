/* eslint-disable camelcase */
import { providers, utils } from 'ethers';

import { TransactionRequest } from '@ethersproject/providers';
import {
  ChainInfo,
  StateInfo,
  OperationResponse,
  LightweightStateV2__factory,
  OperationProof,
  StateProof,
  StateV2__factory,
} from '../types';
import { ILightweightStateV2 } from '../types/contracts/LightweightStateV2';
import {
  getChainInfo,
  getProviderChainInfo,
  getRarimoCoreUrl,
  getRarimoEvmRpcUrl,
  getRarimoStateContractAddress,
} from './common-helpers';
import { FetcherError } from './error-helper';

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
  const rawProvider = new providers.JsonRpcProvider(rpcUrl, 'any');

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
export const getRarimoGISTRoot = async ({
  rpcUrl,
  contractAddress,
}: {
  rpcUrl?: string;
  contractAddress?: string;
} = {}): Promise<bigint> => {
  const providerChainInfo = await getProviderChainInfo();

  const _rpcUrl = rpcUrl ?? getRarimoEvmRpcUrl(providerChainInfo.id);
  const _contractAddress =
    contractAddress ?? getRarimoStateContractAddress(providerChainInfo.id);

  const rawProvider = new providers.JsonRpcProvider(_rpcUrl, 'any');

  const contractInstance = StateV2__factory.connect(
    _contractAddress,
    rawProvider,
  );

  const root = await contractInstance.getGISTRoot();

  return BigInt(root.toString());
};

// getCurrentChainGISTRoot returns the GIST root from a lightweight state contract deployed on the current chain
export const getCurrentChainGISTRoot = async (): Promise<bigint> => {
  const provider = new providers.Web3Provider(
    (ethereum as any) as providers.ExternalProvider,
  );
  const network = await provider.getNetwork();
  const chainInfo = getChainInfo(network.chainId);

  const contractInstance = LightweightStateV2__factory.connect(
    chainInfo.stateContractAddress,
    provider,
  );
  const root = await contractInstance.getGISTRoot();
  return BigInt(root.toString());
};

// checkIfStateSynced returns true if the GIST root from the Rarimo state contract matches the GIST root from the current chain
export const checkIfStateSynced = async (): Promise<boolean> => {
  /*
    NOTE: for now we assume that the state must be synced if the GIST roots don't match
          some more sophisticated logic could be added here in the future
   */
  const rarimoGISTRoot = await getRarimoGISTRoot();
  const currentChainGISTRoot = await getCurrentChainGISTRoot();
  return rarimoGISTRoot === currentChainGISTRoot;
};

export const loadDataFromRarimoCore = async <T>(
  url: string,
  blockHeight?: string,
): Promise<T> => {
  const providerChainInfo = await getProviderChainInfo();

  const rarimoCoreUrl = getRarimoCoreUrl(providerChainInfo.id);

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

type UpdateStateDetails = {
  stateRootHash: string;
  gistRootDataStruct: ILightweightStateV2.GistRootDataStruct;
  proof: string;
};

export const getCoreOperationByIndex = async (index: string) => {
  return loadDataFromRarimoCore<OperationResponse>(
    `/rarimo/rarimo-core/rarimocore/operation/${index}`,
  );
};

export const getUpdateStateDetails = async (
  state: StateInfo,
  operation: OperationResponse,
): Promise<UpdateStateDetails> => {
  let operationProof;
  do {
    try {
      operationProof = await loadDataFromRarimoCore<OperationProof>(
        `/rarimo/rarimo-core/rarimocore/operation/${state.lastUpdateOperationIndex}/proof`,
      );
    } catch (e) {
      if (e instanceof FetcherError && e.response.status === 400) {
        await new Promise((resolve) => setTimeout(resolve, 5_000));
      } else {
        throw e;
      }
    }
  } while (!operationProof);

  const decodedPath = operationProof?.path?.map((el: string) =>
    utils.arrayify(el),
  );
  const decodedSignature = operationProof?.signature
    ? utils.arrayify(operationProof?.signature)
    : undefined;

  if (decodedSignature?.[64] !== undefined) {
    decodedSignature[64] += 27;
  }

  const proof = utils.defaultAbiCoder.encode(
    ['bytes32[]', 'bytes'],
    [decodedPath, decodedSignature],
  );

  return {
    stateRootHash: operation.operation.details.stateRootHash,
    gistRootDataStruct: {
      root: operation.operation.details.GISTHash,
      createdAtTimestamp: Number(operation.operation.details.timestamp),
    },
    proof,
  };
};

export const getUpdateStateTx = async (
  accountId: string,
  chainInfo: ChainInfo,
  state: StateInfo,
  operation: OperationResponse,
  updateStateDetails?: UpdateStateDetails,
): Promise<TransactionRequest> => {
  const { stateRootHash, gistRootDataStruct, proof } =
    updateStateDetails ?? (await getUpdateStateDetails(state, operation));

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
