import type { AccountData, AminoSignResponse } from '@cosmjs/amino';

import type { RARIMO_CHAINS } from '@/consts';
import type { RPCMethods } from '@/enums';
import type { ChainInfo } from '@/types/chains';
import type {
  WalletRequestAminoSignParams,
  WalletRequestDirectSignParams,
  WalletRequestGetKeyParams,
  WalletRequestSuggestChainParams,
  WalletSignDirectResponse,
} from '@/wallet';
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

type RarimoChainId = string;
type TargetChainId = string;

export type SnapRequestParams = {
  [RPCMethods.CreateIdentity]: CreateIdentityRequestParams;
  [RPCMethods.ExportIdentity]: never;
  [RPCMethods.GetIdentity]: never;

  [RPCMethods.SaveCredentials]: [RarimoChainId, ClaimOffer];
  [RPCMethods.RemoveCredentials]: RemoveCredentialsRequestParams;
  [RPCMethods.CheckCredentialExistence]: CheckCredentialExistenceRequestParams;
  [RPCMethods.GetCredentials]: never;

  [RPCMethods.CheckStateContractSync]: [RarimoChainId, TargetChainId];
  [RPCMethods.CreateProof]: [
    RarimoChainId,
    TargetChainId,
    CreateProofRequestParams,
  ];

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
  [RPCMethods.WalletGetSupportedChains]: typeof RARIMO_CHAINS;
};
