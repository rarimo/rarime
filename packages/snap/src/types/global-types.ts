import { NodeType } from '@metamask/snaps-ui';
import { W3CCredential } from './credential-types';

export type TextField = {
  value: string;
  type: NodeType.Text;
};

export type BackupData = {
  privateKey: string;
  credentials: W3CCredential[];
};
