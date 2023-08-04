export const config = {
  AUTH_BJJ_CREDENTIAL_HASH: 'cca3371a6cb1b715004407e325bd993c',
  ID_TYPE: Uint8Array.from([1, 0]),

  RARIMO_EVM_RPC_URL: 'http://localhost:8080',
  RARIMO_CORE_URL: 'http://localhost:8080',
  RARIMO_STATE_CONTRACT_ADDRESS: '0xBf62e5A9C1135c81c8C9010f722B9AE3d4dA7531',

  CIRCUIT_AUTH_WASM_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/authV2/circuit.wasm',
  CIRCUIT_AUTH_FINAL_KEY_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/authV2/circuit_final.zkey',
  CIRCUIT_SIG_V2_ON_CHAIN_WASM_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQuerySigV2OnChain/circuit.wasm',
  CIRCUIT_SIG_V2_ON_CHAIN_FINAL_KEY_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQuerySigV2OnChain/circuit_final.zkey',
  CIRCUIT_SIG_V2_WASM_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQuerySigV2/circuit.wasm',
  CIRCUIT_SIG_V2_FINAL_KEY_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQuerySigV2/circuit_final.zkey',
  CIRCUIT_MTP_V2_WASM_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQueryMTPV2/circuit.wasm',
  CIRCUIT_MTP_V2_FINAL_KEY_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQueryMTPV2/circuit_final.zkey',
  CIRCUIT_MTP_V2_ON_CHAIN_WASM_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQueryMTPV2OnChain/circuit.wasm',
  CIRCUIT_MTP_V2_ON_CHAIN_FINAL_KEY_URL:
    'https://raw.githubusercontent.com/Electr1Xx/circuits/main/credentialAtomicQueryMTPV2OnChain/circuit_final.zkey',
};

enum CHAINS {
  EthereumMainet = 1,
  Bsc = 56,
  Polygon = 137,
  Avalance = 43114,
  Sepolia = 11155111,
}

export const SUPPORTED_CHAINS: Record<
  number,
  {
    rpcUrl: string;
    stateContractAddress: string;
    verifierContractAddress: string;
  }
> = {
  [CHAINS.EthereumMainet]: {
    rpcUrl: '',
    stateContractAddress: '',
    verifierContractAddress: '',
  },
  [CHAINS.Bsc]: {
    rpcUrl: '',
    stateContractAddress: '',
    verifierContractAddress: '',
  },
  [CHAINS.Polygon]: {
    rpcUrl: '',
    stateContractAddress: '',
    verifierContractAddress: '',
  },
  [CHAINS.Avalance]: {
    rpcUrl: '',
    stateContractAddress: '',
    verifierContractAddress: '',
  },
  [CHAINS.Sepolia]: {
    rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    stateContractAddress: '0x803a77bD7aB650aBF6D562260bCc5b32Aa08aD09',
    verifierContractAddress: '',
  },
};
