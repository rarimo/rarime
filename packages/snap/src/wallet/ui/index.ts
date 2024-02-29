import { copyable, heading, text } from '@metamask/snaps-sdk';
import { ChainInfo } from '@rarimo/rarime-connector';

export const getChainPanel = (origin: string, chainInfo: ChainInfo) => {
  const panels: any = [heading(`Add new chain`), copyable(`${origin}`)];
  panels.push(heading('Chain Infomation'));
  panels.push(text(`Name: **${chainInfo.chainName}**`));
  panels.push(text(`Id: **${chainInfo.chainId}**`));
  panels.push(text(`CoinType: **${chainInfo.bip44.coinType}**`));

  panels.push(heading(''));
  panels.push(text(' **Raw message**'));
  panels.push(copyable(`${JSON.stringify(chainInfo, null, 2)}`));
  return panels;
};
