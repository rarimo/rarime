import { NodeType } from '@metamask/snaps-sdk';

export type TextField = {
  value: string;
  type: NodeType.Text;
};

export type RarimoNetworkType = 'mainnet' | 'beta';

export type ChainInfo = {
  id: number;
  rpcUrl: string;
  stateContractAddress: string;
  rarimoNetworkType: RarimoNetworkType;
};
