export const readBytesFile = async (path: string) => {
  const response = await fetch(path);
  return new Uint8Array(await response?.arrayBuffer?.());
};
