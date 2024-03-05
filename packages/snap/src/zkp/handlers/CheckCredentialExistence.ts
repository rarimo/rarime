import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SaveCredentialsResponse,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import { VCManager } from '@/zkp/helpers';

export const CheckCredentialExistence = async ({
  request,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.CheckCredentialExistence]> => {
  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  if (!identityStorage) {
    throw new Error('Identity not created');
  }

  const { claimOffer, proofRequest } =
    request.params as SnapRequestParams[RPCMethods.CheckCredentialExistence];

  const vcManager = await VCManager.create();

  let result: SaveCredentialsResponse[] = [];

  if (claimOffer && proofRequest) {
    const vcs = await vcManager.getDecryptedVCsByOfferAndQuery(
      claimOffer,
      proofRequest,
    );

    result = vcs?.map((vc) => ({
      type: vc.type,
      issuer: vc.issuer,
    }));
  } else if (claimOffer) {
    const vcs = await vcManager.getDecryptedVCsByOffer(claimOffer);

    result = vcs?.map((vc) => ({
      type: vc.type,
      issuer: vc.issuer,
    }));
  } else if (proofRequest) {
    const vcs = await vcManager.getDecryptedVCsByQuery(
      proofRequest.query,
      proofRequest.issuerDid,
    );

    result = vcs?.map((vc) => ({
      type: vc.type,
      issuer: vc.issuer,
    }));
  }

  return result;
};
