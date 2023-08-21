/* eslint-disable camelcase */
import { providers, utils } from 'ethers';

import { TransactionRequest } from '@ethersproject/providers';
import { Id } from '@iden3/js-iden3-core';
import {
  GetStateInfoResponse,
  IdentityNode,
  IdentityParams,
  LightweightStateV2__factory,
  OperationProof,
  StateProof,
  StateV2__factory,
} from '../types';
import { config } from '../config';
import { getChainInfo } from './common-helpers';

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
  console.log(data);
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
  {
    rpcUrl,
    contractAddress,
  }: {
    rpcUrl: string;
    contractAddress: string;
  } = {
    rpcUrl: config.RARIMO_EVM_RPC_URL,
    contractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS,
  },
): Promise<bigint> => {
  const rawProvider = new providers.JsonRpcProvider(rpcUrl, 'any');

  const contractInstance = StateV2__factory.connect(
    contractAddress,
    rawProvider,
  );

  const root = await contractInstance.getGISTRoot();

  return BigInt(root.toString());
};

// getCurrentChainGISTRoot returns the GIST root from a lightweight state contract deployed on the current chain
export const getCurrentChainGISTRoot = async (): Promise<bigint> => {
  const provider = new providers.Web3Provider(window.ethereum);
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

export const loadDataFromRarimoCore = async <T>(url: string): Promise<T> => {
  const data = await fetch(`${config.RARIMO_CORE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  return await data.json();
};

export const getUpdateStateTx = async (
  issuerId: string,
  accountId: string,
): Promise<TransactionRequest> => {
  const provider = new providers.Web3Provider(window.ethereum);
  const network = await provider.getNetwork();
  const chainInfo = getChainInfo(network.chainId);

  console.log(issuerId);
  const ID = Id.fromString('tJgV5GSETVoEdg3BeQygWJdNEHHwZTSSiCB1NkM1u');
  const issuerHexId = `0x0${ID.bigInt().toString(16)}`;

  const stateData = await loadDataFromRarimoCore<GetStateInfoResponse>(
    `/rarimo/rarimo-core/identity/state/${issuerHexId}`,
  );
  const operationProof = await loadDataFromRarimoCore<OperationProof>(
    `/rarimo/rarimo-core/rarimocore/operation/${stateData.state.lastUpdateOperationIndex}/proof`,
  );
  const identityParams = await loadDataFromRarimoCore<IdentityParams>(
    '/rarimo/rarimo-core/identity/params',
  );
  const identityNode = await loadDataFromRarimoCore<IdentityNode>(
    `/rarimo/rarimo-core/identity/node/${identityParams.params.treapRootKey}`,
  );
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

  const contractInterface = LightweightStateV2__factory.createInterface();

  const txData = contractInterface.encodeFunctionData('signedTransitState', [
    identityNode.node.hash,
    {
      root: identityParams.params.GISTHash,
      createdAtTimestamp: identityParams.params.GISTUpdatedTimestamp,
    },
    proof,
  ]);
  return {
    to: chainInfo.stateContractAddress,
    from: accountId,
    chainId: network.chainId,
    data: txData,
  };
};
