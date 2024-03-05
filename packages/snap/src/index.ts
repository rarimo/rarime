// eslint-disable-next-line import/no-unassigned-import
import './polyfill';
import { RPCMethods } from '@rarimo/rarime-connector';
import type { JsonRpcRequest } from '@metamask/utils';
import { migrateVCsToLastCeramicModel } from '@/zkp/helpers';
import {
  CheckCredentialExistence,
  checkStateContractSync,
  createIdentity,
  createProof,
  exportIdentity,
  getCredentials,
  getIdentity,
  removeCredentials,
  saveCredentials,
} from '@/zkp';
import {
  walletSignDirect,
  walletSignAmino,
  walletGetKey,
  walletSuggestChain,
  walletGetSupportedChains,
} from '@/wallet';

export const onRpcRequest = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}) => {
  if (request.method !== RPCMethods.CreateIdentity) {
    await migrateVCsToLastCeramicModel();
  }

  switch (request.method) {
    case RPCMethods.CheckCredentialExistence: {
      return CheckCredentialExistence({ request, origin });
    }

    case RPCMethods.RemoveCredentials: {
      return removeCredentials({ request, origin });
    }

    case RPCMethods.SaveCredentials: {
      return saveCredentials({ request, origin });
    }

    case RPCMethods.CreateIdentity: {
      return createIdentity({ request, origin });
    }

    case RPCMethods.GetIdentity: {
      return getIdentity();
    }

    case RPCMethods.CreateProof: {
      return createProof({ request, origin });
    }

    case RPCMethods.CheckStateContractSync: {
      return checkStateContractSync();
    }

    case RPCMethods.GetCredentials: {
      return getCredentials({ request, origin });
    }

    case RPCMethods.ExportIdentity: {
      return exportIdentity({ request, origin });
    }

    // WALLET

    case RPCMethods.WalletSignDirect: {
      return walletSignDirect({ request, origin });
    }

    case RPCMethods.WalletSignAmino: {
      return walletSignAmino({ request, origin });
    }

    case RPCMethods.WalletGetKey: {
      return walletGetKey({ request, origin });
    }

    case RPCMethods.WalletSuggestChain: {
      return walletSuggestChain({ request, origin });
    }

    case RPCMethods.WalletGetSupportedChains: {
      return walletGetSupportedChains();
    }

    default:
      throw new Error('Method not found.');
  }
};
