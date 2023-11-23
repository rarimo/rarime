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
