/* eslint-disable camelcase */
import { providers } from 'ethers';

import { StateProof, StateV2__factory } from '../types';

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
