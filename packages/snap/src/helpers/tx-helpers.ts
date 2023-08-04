import { TransactionRequest } from '@ethersproject/providers';
import { divider, heading, panel, text } from '@metamask/snaps-ui';
import { Wallet } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

export const sendTx = async (
  tx: TransactionRequest,
  signer: Wallet,
  title?: string,
) => {
  const confirm = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        heading(title || 'Submit tx'),
        text('Check all field before send transaction!'),
        divider(),
        text(`From: ${tx.from}`),
        text(`To: ${tx.to}`),
        text(`Gas limit: ${tx.gasLimit}`),
        text(
          `Max fee per gas (GWEI): ${formatUnits(tx.maxFeePerGas!, 'gwei')}`,
        ),
        text(
          `Max priority fee per gas(GWEI): ${formatUnits(
            tx.maxPriorityFeePerGas!,
            'gwei',
          )}`,
        ),
        text(`Chain id: ${tx.chainId}`),
        text(`Data: ${tx.data}`),
      ]),
    },
  });

  if (confirm) {
    try {
      const transactionResponse = await signer.sendTransaction(tx);
      return transactionResponse.wait();
    } catch (e) {
      throw new Error(e);
    }
  } else {
    throw new Error('User rejected request');
  }
};
