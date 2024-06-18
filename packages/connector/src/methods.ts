/* eslint-disable no-invalid-this */
import { getUpdateStateDetails, getUpdateStateTx } from './helpers';
import type { MetamaskSnap } from './snap';
import type {
  CheckCredentialExistenceRequestParams,
  CreateIdentityRequestParams,
  CreateProofRequestParams,
  RemoveCredentialsRequestParams,
  IdentityDidPair,
  SaveCredentialsRequestParams,
  SaveCredentialsResponse,
  W3CCredential,
  ZKPProofResponse,
  ZKPProofSnapResponse,
} from './types';
import { RPCMethods } from './types';

const sendSnapMethod = async <T>(
  request: { method: string; params?: any },
  snapId: string,
): Promise<T> => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      request: {
        method: request.method,
        ...(request.params && { params: request.params }),
      },
      snapId,
    },
  });
};

export const checkCredentialExistence = async function (
  this: MetamaskSnap,
  params: CheckCredentialExistenceRequestParams,
): Promise<SaveCredentialsResponse[]> {
  return await sendSnapMethod(
    { method: RPCMethods.CheckCredentialExistence, params },
    this.snapId,
  );
};

export const createIdentity = async function (
  this: MetamaskSnap,
  params?: CreateIdentityRequestParams,
): Promise<IdentityDidPair> {
  return await sendSnapMethod(
    { method: RPCMethods.CreateIdentity, params },
    this.snapId,
  );
};

export const getIdentity = async function (
  this: MetamaskSnap,
): Promise<IdentityDidPair> {
  return await sendSnapMethod(
    {
      method: RPCMethods.GetIdentity,
    },
    this.snapId,
  );
};

export const saveCredentials = async function (
  this: MetamaskSnap,
  params: SaveCredentialsRequestParams,
): Promise<SaveCredentialsResponse[]> {
  return await sendSnapMethod(
    { method: RPCMethods.SaveCredentials, params },
    this.snapId,
  );
};

export const removeCredentials = async function (
  this: MetamaskSnap,
  params: RemoveCredentialsRequestParams,
): Promise<void> {
  return await sendSnapMethod(
    { method: RPCMethods.RemoveCredentials, params },
    this.snapId,
  );
};

export const createProof = async function (
  this: MetamaskSnap,
  params: CreateProofRequestParams,
): Promise<ZKPProofResponse> {
  const snapResponse = (await sendSnapMethod(
    { method: RPCMethods.CreateProof, params },
    this.snapId,
  )) as ZKPProofSnapResponse;

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

export const checkStateContractSync = async function (
  this: MetamaskSnap,
): Promise<boolean> {
  return await sendSnapMethod(
    { method: RPCMethods.CheckStateContractSync },
    this.snapId,
  );
};

export const getCredentials = async function (
  this: MetamaskSnap,
): Promise<W3CCredential[]> {
  return await sendSnapMethod(
    { method: RPCMethods.GetCredentials },
    this.snapId,
  );
};

export const exportIdentity = async function (
  this: MetamaskSnap,
): Promise<void> {
  return await sendSnapMethod(
    { method: RPCMethods.ExportIdentity },
    this.snapId,
  );
};
