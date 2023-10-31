import { NodeType } from '@metamask/snaps-ui';
import { providers } from 'ethers';

export type TextField = {
  value: string;
  type: NodeType.Text;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: providers.ExternalProvider;
  }
}

export type RarimoNetworkType = 'mainnet' | 'beta';

export type ChainInfo = {
  id: number;
  rpcUrl: string;
  stateContractAddress: string;
  rarimoNetworkType: RarimoNetworkType;
};
