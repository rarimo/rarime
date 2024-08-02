export const readBytesFile = async (path: string) => {
  const response = await fetch(path);
  return new Uint8Array(await response?.arrayBuffer?.());
};

export const getFileBytes = async (
  path: string | string[],
  loadCircuitsCb?: (path: string | string[]) => Promise<Uint8Array>,
): Promise<Uint8Array> => {
  if (typeof path === 'string') {
    return loadCircuitsCb?.(path) || readBytesFile(path);
  }

  if (!loadCircuitsCb) {
    throw new TypeError('loadCircuitsCb is required for multiple paths');
  }

  return loadCircuitsCb?.(path);
};
