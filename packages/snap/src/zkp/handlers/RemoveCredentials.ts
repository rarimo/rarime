import type { Component } from '@metamask/snaps-sdk';
import { divider, heading, panel, text } from '@metamask/snaps-sdk';
import type { JsonRpcRequest } from '@metamask/utils';
import type {
  RPCMethods,
  SnapRequestParams,
  SnapRequestsResponses,
} from '@rarimo/rarime-connector';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import {
  getClaimIdFromVCId,
  isOriginInWhitelist,
  VCManager,
} from '@/zkp/helpers';

export const removeCredentials = async ({
  request,
  origin,
}: {
  request: JsonRpcRequest;
  origin: string;
}): Promise<SnapRequestsResponses[RPCMethods.RemoveCredentials]> => {
  if (!isOriginInWhitelist(origin)) {
    throw new Error(
      'This origin does not have access to the RemoveCredentials method',
    );
  }

  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  if (!identityStorage) {
    throw new Error('Identity not created');
  }

  const params =
    request.params as SnapRequestParams[RPCMethods.RemoveCredentials];

  const claimIds = params.ids.map((id) => getClaimIdFromVCId(id));

  const vcManager = await VCManager.create();

  const vcs = await vcManager.getDecryptedVCsByClaimIds(claimIds);

  const res = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        heading('Remove the following credentials'),
        divider(),

        ...vcs.reduce<Component[]>((acc, el, idx) => {
          const vcTargetType = el.type[1];
          const vcID = el.id;

          return acc.concat([
            text(`**Credential #${idx + 1}**`),
            text(`Type: ${vcTargetType}`),
            text(`ID: ${vcID}`),
            divider(),
          ]);
        }, []),
      ]),
    },
  });

  if (!res) {
    throw new Error('User rejected request');
  }

  await Promise.all(vcs.map(async (vc) => vcManager.clearMatchedVcs(vc)));

  return undefined;
};
