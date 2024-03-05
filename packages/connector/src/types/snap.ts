import { AccountData, AminoSignResponse } from '@cosmjs/amino';
import { RPCMethods } from '@/enums';
import {
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
import {
  ChainInfo,
  WalletRequestAminoSignParams,
  WalletRequestDirectSignParams,
  WalletRequestGetKeyParams,
  WalletRequestSuggestChainParams,
  WalletSignDirectResponse,
  CHAINS,
} from '@/wallet';

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

  [RPCMethods.WalletSignDirect]: WalletRequestDirectSignParams;
  [RPCMethods.WalletSignAmino]: WalletRequestAminoSignParams;
  [RPCMethods.WalletGetKey]: WalletRequestGetKeyParams;
  [RPCMethods.WalletSuggestChain]: WalletRequestSuggestChainParams;
  [RPCMethods.WalletGetSupportedChains]: never;
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

  [RPCMethods.WalletSignDirect]: WalletSignDirectResponse;
  [RPCMethods.WalletSignAmino]: AminoSignResponse;
  [RPCMethods.WalletGetKey]: AccountData;
  [RPCMethods.WalletSuggestChain]: { message: string; chainInfo: ChainInfo };
  [RPCMethods.WalletGetSupportedChains]: typeof CHAINS;
};
