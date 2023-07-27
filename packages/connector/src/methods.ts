/* eslint-disable no-invalid-this */
import { MetamaskSnap } from './snap';
import {
  CreateProofRequestParams,
  SaveCredentialsRequestParams,
  W3CCredential,
  ZKProof,
} from './types';

const sendSnapMethod = async <T>(
  request: unknown,
  snapId: string,
): Promise<T> => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      request,
      snapId,
    },
  });
};

export const createIdentity = async function (
  this: MetamaskSnap,
): Promise<string> {
  return await sendSnapMethod({ method: 'create_identity' }, this.snapId);
};

export const createBackup = async function (
  this: MetamaskSnap,
): Promise<boolean> {
  return await sendSnapMethod({ method: 'create_backup' }, this.snapId);
};

export const recoverBackup = async function (
  this: MetamaskSnap,
): Promise<boolean> {
  return await sendSnapMethod({ method: 'recover_backup' }, this.snapId);
};

export const saveCredentials = async function (
  this: MetamaskSnap,
  params: SaveCredentialsRequestParams,
): Promise<W3CCredential[]> {
  return await sendSnapMethod(
    { method: 'save_credentials', params },
    this.snapId,
  );
};

export const createProof = async function (
  this: MetamaskSnap,
  params: CreateProofRequestParams,
): Promise<ZKProof> {
  return await sendSnapMethod({ method: 'create_proof', params }, this.snapId);
};
