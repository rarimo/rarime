import { RPCMethods } from '@/enums';
import { RarimeSnapBase } from '@/instances';
import type { SnapRequestsResponses } from '@/types';
import { getUpdateStateDetails, getUpdateStateTx } from '@/zkp/helpers';
import type {
  CheckCredentialExistenceRequestParams,
  CreateIdentityRequestParams,
  ZKPProofResponse,
  ClaimOffer,
  RemoveCredentialsRequestParams,
  CreateProofRequestParams,
} from '@/zkp/types';

export class ZkpSnap extends RarimeSnapBase {
  createIdentity = async (
    params?: CreateIdentityRequestParams,
  ): Promise<SnapRequestsResponses[RPCMethods.CreateIdentity]> => {
    return this.sendSnapRequest(RPCMethods.CreateIdentity, params);
  };

  exportIdentity = async (): Promise<
    SnapRequestsResponses[RPCMethods.ExportIdentity]
  > => {
    return this.sendSnapRequest(RPCMethods.ExportIdentity);
  };

  getIdentity = async (): Promise<
    SnapRequestsResponses[RPCMethods.GetIdentity]
  > => {
    return this.sendSnapRequest(RPCMethods.GetIdentity);
  };

  checkCredentialExistence = async (
    params: CheckCredentialExistenceRequestParams,
  ): Promise<SnapRequestsResponses[RPCMethods.CheckCredentialExistence]> => {
    return this.sendSnapRequest(RPCMethods.CheckCredentialExistence, params);
  };

  saveCredentials = async (
    params: ClaimOffer,
  ): Promise<SnapRequestsResponses[RPCMethods.SaveCredentials]> => {
    const { coreChain } = await this._getChainInfo();

    return this.sendSnapRequest(RPCMethods.SaveCredentials, [
      coreChain,
      params,
    ]);
  };

  removeCredentials = async (
    params: RemoveCredentialsRequestParams,
  ): Promise<SnapRequestsResponses[RPCMethods.RemoveCredentials]> => {
    return this.sendSnapRequest(RPCMethods.RemoveCredentials, params);
  };

  getCredentials = async (): Promise<
    SnapRequestsResponses[RPCMethods.GetCredentials]
  > => {
    return this.sendSnapRequest(RPCMethods.GetCredentials);
  };

  checkStateContractSync = async (): Promise<
    SnapRequestsResponses[RPCMethods.CheckStateContractSync]
  > => {
    return this.sendSnapRequest(RPCMethods.CheckStateContractSync);
  };

  createProof = async (
    params: CreateProofRequestParams,
  ): Promise<ZKPProofResponse> => {
    const { coreChain, targetChain } = await this._getChainInfo();

    const snapResponse = await this.sendSnapRequest(RPCMethods.CreateProof, [
      coreChain,
      targetChain,
      params,
    ]);

    const updateStateDetails = await getUpdateStateDetails(
      snapResponse.stateData,
      snapResponse.operation,
      coreChain.rest,
    );

    let updateStateTx;

    if (!snapResponse.isSynced) {
      updateStateTx = await getUpdateStateTx(
        params.accountAddress!,
        targetChain.targetChainId,
        targetChain.targetStateContractAddress,
        snapResponse.stateData,
        snapResponse.operation,
        coreChain.rest,
        updateStateDetails,
      );
    }

    return {
      statesMerkleData: {
        issuerId: snapResponse.issuerHexId,
        state: snapResponse.stateData,
        merkleProof: snapResponse.merkleProof.proof,
      },

      zkpProof: snapResponse.zkpProof,
      updateStateDetails,

      ...(updateStateTx && { updateStateTx }),
    };
  };
}

export * from './consts';
export * from './helpers';
export * from './types';
export * from './enums';
