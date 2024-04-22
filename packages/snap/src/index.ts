// eslint-disable-next-line import/no-unassigned-import
import './polyfill';

import type { JsonRpcRequest } from '@metamask/utils';
import { RPCMethods } from '@rarimo/rarime-connector';

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
import { migrateVCsToLastCeramicModel } from '@/zkp/helpers';

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
      return checkStateContractSync({ request });
    }

    case RPCMethods.GetCredentials: {
      return getCredentials({ request, origin });
    }

    case RPCMethods.ExportIdentity: {
      return exportIdentity({ request, origin });
    }

    default:
      throw new Error('Method not found.');
  }
};
