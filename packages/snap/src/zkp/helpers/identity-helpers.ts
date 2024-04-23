export const derivePrivateKeyHex = async (salt?: string) => {
  const entropy = await snap.request({
    method: 'snap_getEntropy',
    params: {
      version: 1,
      ...(salt ? { salt } : {}),
    },
  });
  return entropy.startsWith('0x') ? entropy.substring(2) : entropy;
};
