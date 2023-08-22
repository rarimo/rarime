import { NodeType } from '@metamask/snaps-ui';
import { providers } from 'ethers';
import { W3CCredential } from './credential-types';

export type TextField = {
  value: string;
  type: NodeType.Text;
};

export type BackupData = {
  privateKey: string;
  credentials: W3CCredential[];
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: providers.ExternalProvider;
  }
}

export type ChainInfo = {
  id: number;
  rpcUrl: string;
  stateContractAddress: string;
  verifierContractAddress: string;
};
