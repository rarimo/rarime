/* eslint-disable camelcase */
import { providers } from 'ethers';

import { LightweightStateV2__factory, StateProof, StateV2__factory } from '../types';

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
  userId,
}: {
  rpcUrl: string;
  contractAddress: string;
  userId: string;
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
  userId,
}: {
  contractAddress: string;
  userId: string;
}): Promise<BigInt> => {
  const contractInstance = LightweightStateV2__factory.connect(
    contractAddress,
    new providers.Web3Provider(window.ethereum),
  );

  const root = await contractInstance.getGISTRoot();

  return BigInt(root.toString());
};

