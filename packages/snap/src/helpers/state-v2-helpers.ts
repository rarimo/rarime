/* eslint-disable camelcase */
import { providers } from 'ethers';

import { StateV2__factory } from '../types';

export const getGISTProof = async ({
  rpcUrl,
  contractAddress,
  userId,
}: {
  rpcUrl: string;
  contractAddress: string;
  userId: string;
}) => {
  const rawProvider = new providers.JsonRpcProvider(rpcUrl, 'any');

  const contractInstance = StateV2__factory.connect(
    contractAddress,
    rawProvider,
  );

  return contractInstance.getGISTProof(userId);
};
