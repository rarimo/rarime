export const config = {
  AUTH_BJJ_CREDENTIAL_HASH: 'cca3371a6cb1b715004407e325bd993c',
  ID_TYPE: Uint8Array.from([1, 0]),

  RARIMO_EVM_RPC_URL: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
  RARIMO_CORE_URL: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
  RARIMO_STATE_CONTRACT_ADDRESS: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',

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
    stateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',
    verifierContractAddress: '0x01A1e46fE9108f60B8de1c99bA50f29F3Be294F6',
  },
};
