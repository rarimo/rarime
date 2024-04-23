import type { OnInstallHandler, OnUpdateHandler } from '@metamask/snaps-sdk';
import { heading, panel, text } from '@metamask/snaps-sdk';

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Installation successful'),
        text(
          'To use this Snap, visit the companion dapp at [metamask.io](https://metamask.io).',
        ),
      ]),
    },
  });
};

export const onUpdate: OnUpdateHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Update successful'),
        text('New features added in this version:'),
        text('Added a dialog that appears when updating.'),
      ]),
    },
  });
};
