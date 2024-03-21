import versionJson from '../version.json';

import { defaultSnapOrigin } from '@/consts';
import { RPCMethods } from '@/enums';
import { RarimeSnapBase } from '@/instances';
import type { SnapRequestParams, SnapRequestsResponses } from '@/types';
import { getUpdateStateDetails, getUpdateStateTx } from '@/zkp/helpers';
import type { ZKPProofResponse } from '@/zkp/types';

export class ZkpSnap extends RarimeSnapBase {
  public constructor(
    snapId = defaultSnapOrigin,
    version = versionJson.version,
  ) {
    super(snapId, version);
  }

  createIdentity = async (
    params?: SnapRequestParams[RPCMethods.CreateIdentity],
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
    params: SnapRequestParams[RPCMethods.CheckCredentialExistence],
  ): Promise<SnapRequestsResponses[RPCMethods.CheckCredentialExistence]> => {
    return this.sendSnapRequest(RPCMethods.CheckCredentialExistence, params);
  };

  saveCredentials = async (
    params: SnapRequestParams[RPCMethods.SaveCredentials],
  ): Promise<SnapRequestsResponses[RPCMethods.SaveCredentials]> => {
    return this.sendSnapRequest(RPCMethods.SaveCredentials, params);
  };

  removeCredentials = async (
    params: SnapRequestParams[RPCMethods.RemoveCredentials],
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
    params: SnapRequestParams[RPCMethods.CreateProof],
  ): Promise<ZKPProofResponse> => {
    const snapResponse = await this.sendSnapRequest(
      RPCMethods.CreateProof,
      params,
    );

    const updateStateDetails = await getUpdateStateDetails(
      snapResponse.stateData,
      snapResponse.operation,
      snapResponse.rarimoCoreUrl,
    );

    let updateStateTx;

    if (!snapResponse.isSynced) {
      updateStateTx = await getUpdateStateTx(
        params.accountAddress!,
        snapResponse.chainInfo,
        snapResponse.stateData,
        snapResponse.operation,
        snapResponse.rarimoCoreUrl,
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
