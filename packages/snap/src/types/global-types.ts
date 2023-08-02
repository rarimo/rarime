import { NodeType } from '@metamask/snaps-ui';
import { W3CCredential } from './credential-types';
import { MetaMaskInpageProvider } from '@metamask/providers';

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
    ethereum: MetaMaskInpageProvider;
  }
}