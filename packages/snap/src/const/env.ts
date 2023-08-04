/* TODO:
  - allow user to override the defaults
  - add all supported networks once the contracts are deployed
 */

export const RARIMO_EVM_RPC_URL = 'http://localhost:8080';
export const RARIMO_STATE_CONTRACT_ADDRESS = '0xBf62e5A9C1135c81c8C9010f722B9AE3d4dA7531';

export const STATE_CONTRACT_ADDRESS_BY_CHAIN_ID: Record<number, string> = {
  58008: '0xBf62e5A9C1135c81c8C9010f722B9AE3d4dA7531', // Sepolia
};

export function getStateContractAddress(chainId: number): string {
  let contractAddress = STATE_CONTRACT_ADDRESS_BY_CHAIN_ID[chainId];
  if (!contractAddress) {
    throw new Error("No state contract address for chainId " + chainId);
  }

  return contractAddress;
}
