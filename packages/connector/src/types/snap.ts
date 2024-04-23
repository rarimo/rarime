import type { RPCMethods } from '@/enums';
import type { ChainInfo, ChainZkpInfo } from '@/types/chains';
import type {
  CheckCredentialExistenceRequestParams,
  ClaimOffer,
  CreateIdentityRequestParams,
  CreateProofRequestParams,
  IdentityDidPair,
  RemoveCredentialsRequestParams,
  SaveCredentialsResponse,
  W3CCredential,
  ZKPProofSnapResponse,
} from '@/zkp';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: any;
  }
}

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

  [RPCMethods.SaveCredentials]: [ChainInfo, ClaimOffer];
  [RPCMethods.RemoveCredentials]: RemoveCredentialsRequestParams;
  [RPCMethods.CheckCredentialExistence]: CheckCredentialExistenceRequestParams;
  [RPCMethods.GetCredentials]: never;

  [RPCMethods.CheckStateContractSync]: [ChainInfo, ChainZkpInfo];
  [RPCMethods.CreateProof]: [ChainInfo, ChainZkpInfo, CreateProofRequestParams];
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
