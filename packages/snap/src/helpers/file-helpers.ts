export const readBytesFile = async (path: string) => {
  const response = await fetch(path);
  return new Uint8Array(await response?.arrayBuffer?.());
};

export const getSnapFileBytes = async (path: string) => {
  const response = await snap.request({
    method: 'snap_getFile',
    params: { path },
  });

  const binaryString = window.atob(response);

  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

export const concatAndGetShardedFiles = async (
  paths: string[],
): Promise<Uint8Array> => {
  const files = await Promise.all(paths.map(getSnapFileBytes));

  return new Uint8Array(
    files.reduce((acc, fileBytes) => {
      return [...acc, ...fileBytes];
    }, []),
  );
};

export const getFileBytes = async (path: string | string[]) => {
  if (typeof path === 'string') {
    try {
      return await readBytesFile(new URL(path).href);
    } catch (error) {
      return await getSnapFileBytes(path);
    }
  }

  return await concatAndGetShardedFiles(path);
};
