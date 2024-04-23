import { HOSTNAMES_WHITELIST } from '@/config';

export const getHostname = (origin: string): string => {
  return new URL(origin).hostname;
};

export const isOriginInWhitelist = (origin: string) => {
  return HOSTNAMES_WHITELIST.includes(getHostname(origin));
};
