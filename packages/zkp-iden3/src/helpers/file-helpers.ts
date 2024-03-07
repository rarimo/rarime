export const readBytesFile = async (path: string) => {
  const response = await fetch(path)
  return new Uint8Array(await response?.arrayBuffer?.())
}

export const getFileBytes = async (
  path: string,
  loadCircuitsCb?: (path: string) => Promise<Uint8Array>,
): Promise<Uint8Array> => {
  return loadCircuitsCb?.(path) || readBytesFile(path)
}
