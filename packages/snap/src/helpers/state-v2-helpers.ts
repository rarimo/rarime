/* eslint-disable camelcase */
import { providers } from 'ethers';

import { LightweightStateV2__factory, StateProof, StateV2__factory } from '../types';
import { RARIMO_EVM_RPC_URL, RARIMO_STATE_CONTRACT_ADDRESS } from '../const';

export const getGISTProof = async ({
  rpcUrl,
  contractAddress,
  userId,
}: {
  rpcUrl: string;
  contractAddress: string;
  userId: string;
}): Promise<StateProof> => {
  const rawProvider = new providers.JsonRpcProvider(rpcUrl, 'any');

  const contractInstance = StateV2__factory.connect(
    contractAddress,
    rawProvider,
  );

  const data = await contractInstance.getGISTProof(userId);

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
  rpcUrl: string;
  contractAddress: string;
} = {
  rpcUrl: RARIMO_EVM_RPC_URL,
  contractAddress: RARIMO_STATE_CONTRACT_ADDRESS,
}): Promise<BigInt> => {
  const rawProvider = new providers.JsonRpcProvider(rpcUrl, 'any');

  const contractInstance = StateV2__factory.connect(
    contractAddress,
    rawProvider,
  );

  const root = await contractInstance.getGISTRoot();

  return BigInt(root.toString());
};

// getCurrentChainGISTRoot returns the GIST root from a lightweight state contract deployed on the current chain
export const getCurrentChainGISTRoot = async ({
  contractAddress,
}: {
  contractAddress: string;
}): Promise<BigInt> => {
  const contractInstance = LightweightStateV2__factory.connect(
    contractAddress,
    new providers.Web3Provider(window.ethereum),
  );
  const root = await contractInstance.getGISTRoot();

  return BigInt(root.toString());
};

// checkIfStateSynced returns true if the GIST root from the Rarimo state contract matches the GIST root from the current chain
export const checkIfStateSynced = async ({
  currentChainContractAddress, // TODO: get this from config/constnats
}: {
  currentChainContractAddress: string;
}): Promise<boolean> => {
  const rarimoGISTRoot = await getRarimoGISTRoot();
  const currentChainGISTRoot = await getCurrentChainGISTRoot({
    contractAddress: currentChainContractAddress
  });

  return rarimoGISTRoot === currentChainGISTRoot;
};
