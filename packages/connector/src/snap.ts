import { SnapConnector } from './types';
import {
  createBackup,
  createIdentity,
  createProof,
  recoverBackup,
  saveCredentials,
  checkStateContractSync,
} from './methods';

export class MetamaskSnap {
  public readonly snapId: string;

  public constructor(snapId: string) {
    this.snapId = snapId;
  }

  public getConnector = async (): Promise<SnapConnector> => {
    return {
      createIdentity: createIdentity.bind(this),
      createBackup: createBackup.bind(this),
      recoverBackup: recoverBackup.bind(this),
      saveCredentials: saveCredentials.bind(this),
      createProof: createProof.bind(this),
      checkStateContractSync: checkStateContractSync.bind(this),
    };
  };
}
