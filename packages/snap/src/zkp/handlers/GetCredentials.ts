import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { isOriginInWhitelist, VCManager } from '@/zkp/helpers';

export const getCredentials = async ({
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.GetCredentials]> => {
  if (!isOriginInWhitelist(origin)) {
    throw new Error('This origin does not have access to credentials');
  }

  const vcManager = await VCManager.create();

  return await vcManager.getAllDecryptedVCs();
};
