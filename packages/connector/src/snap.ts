import { SnapConnector } from './types';
import {
  createIdentity,
  createProof,
  saveCredentials,
  checkStateContractSync,
  getCredentials,
  checkCredentialExistence,
  exportPK,
} from './methods';

export class MetamaskSnap {
  public readonly snapId: string;

  public constructor(snapId: string) {
    this.snapId = snapId;
  }

  public getConnector = async (): Promise<SnapConnector> => {
    return {
      createIdentity: createIdentity.bind(this),
      saveCredentials: saveCredentials.bind(this),
      createProof: createProof.bind(this),
      checkStateContractSync: checkStateContractSync.bind(this),
      getCredentials: getCredentials.bind(this),
      checkCredentialExistence: checkCredentialExistence.bind(this),
      exportPK: exportPK.bind(this),
    };
  };
}
