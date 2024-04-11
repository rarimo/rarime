import type { RPCMethods } from '@/enums';
import type {
  CheckCredentialExistenceRequestParams,
  CreateIdentityRequestParams,
  CreateProofRequestParams,
  IdentityDidPair,
  RemoveCredentialsRequestParams,
  SaveCredentialsRequestParams,
  SaveCredentialsResponse,
  W3CCredential,
  ZKPProofSnapResponse,
} from '@/zkp';

export type GetSnapsResponse = {
  [k: string]: {
    permissionName?: string;
    id?: string;
    version?: string;
    initialPermissions?: { [k: string]: unknown };
  };
};

export type SnapRequestParams = {
  [RPCMethods.CreateIdentity]: CreateIdentityRequestParams;
  [RPCMethods.ExportIdentity]: never;
  [RPCMethods.GetIdentity]: never;

  [RPCMethods.SaveCredentials]: SaveCredentialsRequestParams;
  [RPCMethods.RemoveCredentials]: RemoveCredentialsRequestParams;
  [RPCMethods.CheckCredentialExistence]: CheckCredentialExistenceRequestParams;
  [RPCMethods.GetCredentials]: never;

  [RPCMethods.CheckStateContractSync]: never;
  [RPCMethods.CreateProof]: CreateProofRequestParams;
};

export type SnapRequestsResponses = {
  [RPCMethods.CreateIdentity]: IdentityDidPair;
  [RPCMethods.ExportIdentity]: void;
  [RPCMethods.GetIdentity]: IdentityDidPair;

  [RPCMethods.SaveCredentials]: SaveCredentialsResponse[];
  [RPCMethods.RemoveCredentials]: void;
  [RPCMethods.CheckCredentialExistence]: SaveCredentialsResponse[];
  [RPCMethods.GetCredentials]: W3CCredential[];

  [RPCMethods.CheckStateContractSync]: boolean;
  [RPCMethods.CreateProof]: ZKPProofSnapResponse;
};
