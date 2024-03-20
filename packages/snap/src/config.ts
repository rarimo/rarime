import type { ChainZkpInfo } from '@rarimo/rarime-connector';

export const config = {
  AUTH_BJJ_CREDENTIAL_HASH: 'cca3371a6cb1b715004407e325bd993c',
  ID_TYPE: Uint8Array.from([1, 0]),

  RARIMO_EVM_RPC_URL: {
    beta: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
    mainnet: 'https://rpc.evm.mainnet.rarimo.com',
  },
  RARIMO_CORE_URL: {
    beta: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
    mainnet: 'https://rpc-api.mainnet.rarimo.com',
  },
  RARIMO_STATE_CONTRACT_ADDRESS: {
    beta: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',
    mainnet: '0x5ac96945a771d417B155Cb07A3D7E4b8e2F33FdE',
  },

  CIRCUIT_AUTH_WASM_URL: './assets/circuits/auth/circuit.wasm',
  CIRCUIT_AUTH_FINAL_KEY_URL: './assets/circuits/auth/circuit_final.zkey',

  CIRCUIT_SIG_V2_ON_CHAIN_WASM_URL:
    'https://storage.googleapis.com/rarimo-store/snap/QmS4vURQ1c8tgALSokdTYVqx5E9FmASbu964W3JevnM3B4',
  CIRCUIT_SIG_V2_ON_CHAIN_FINAL_KEY_URL:
    'https://storage.googleapis.com/rarimo-store/snap/QmT45Y62hfZnADq6VvKGjNR8foNb2KjcyG4AStRRAN9iHm',

  CIRCUIT_SIG_V2_WASM_URL:
    'https://storage.googleapis.com/rarimo-store/snap/QmYB5QLvH5ihiedxvzkG3XPQngjxcS8wc1xCAoKnGS5GfC',
  CIRCUIT_SIG_V2_FINAL_KEY_URL:
    'https://storage.googleapis.com/rarimo-store/snap/QmeXxRXxYGCwa48ANikH5Knzi9cgkmhumPbMtjTKNYkThL',

  CIRCUIT_MTP_V2_WASM_URL:
    'https://storage.googleapis.com/rarimo-store/snap/QmRqGgnN6Qy4LuPxQKH2wrADNe4aJb8wYJhS1ky9zbLS8t',
  CIRCUIT_MTP_V2_FINAL_KEY_URL:
    'https://storage.googleapis.com/rarimo-store/snap/QmcLyDLPWJpyEWeR9KkWQuGHAqifnwpDAWBX1R6a7g6F6a',

  CIRCUIT_MTP_V2_ON_CHAIN_WASM_URL:
    './assets/circuits/credentialAtomicQueryMTPV2OnChain/circuit.wasm',
  CIRCUIT_MTP_V2_ON_CHAIN_FINAL_KEY_URL:
    './assets/circuits/credentialAtomicQueryMTPV2OnChain/circuit_final.zkey',
};

enum CHAINS {
  EthereumMainet = 1,
  Bsc = 56,
  Polygon = 137,
  Avalance = 43114,
  Sepolia = 11155111,
  Goerly = 5,
}

export const SUPPORTED_CHAINS: Record<number, ChainZkpInfo> = {
  [CHAINS.Polygon]: {
    targetChainId: CHAINS.Polygon,
    targetRpcUrl: 'https://polygon-rpc.com',
    targetStateContractAddress: '0xf9bA419ad9c82451d31d89917db61253a1e46B3C',

    rarimoApiUrl: config.RARIMO_CORE_URL.mainnet,
    rarimoEvmRpcApiUrl: config.RARIMO_EVM_RPC_URL.mainnet,
    rarimoStateContractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS.mainnet,

    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.EthereumMainet]: {
    targetChainId: CHAINS.EthereumMainet,
    targetRpcUrl: 'https://eth.llamarpc.com',
    targetStateContractAddress: '0xB11D49e873A1B4a8c54520A9b6a3c8E017AfE7BB',

    rarimoApiUrl: config.RARIMO_CORE_URL.mainnet,
    rarimoEvmRpcApiUrl: config.RARIMO_EVM_RPC_URL.mainnet,
    rarimoStateContractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS.mainnet,

    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.Bsc]: {
    targetChainId: CHAINS.Bsc,
    targetRpcUrl: 'https://bsc-dataseed.binance.org',
    targetStateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',

    rarimoApiUrl: config.RARIMO_CORE_URL.mainnet,
    rarimoEvmRpcApiUrl: config.RARIMO_EVM_RPC_URL.mainnet,
    rarimoStateContractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS.mainnet,

    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.Avalance]: {
    targetChainId: CHAINS.Avalance,
    targetRpcUrl: 'https://avax.meowrpc.com',
    targetStateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',

    rarimoApiUrl: config.RARIMO_CORE_URL.mainnet,
    rarimoEvmRpcApiUrl: config.RARIMO_EVM_RPC_URL.mainnet,
    rarimoStateContractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS.mainnet,

    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.Sepolia]: {
    targetChainId: CHAINS.Sepolia,
    targetRpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    targetStateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',

    rarimoApiUrl: config.RARIMO_CORE_URL.beta,
    rarimoEvmRpcApiUrl: config.RARIMO_EVM_RPC_URL.beta,
    rarimoStateContractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS.beta,

    rarimoNetworkType: 'beta',
  },
  [CHAINS.Goerly]: {
    targetChainId: CHAINS.Goerly,
    targetRpcUrl: 'https://ethereum-goerli.publicnode.com',
    targetStateContractAddress: '0x0F08e8EA245E63F2090Bf3fF3772402Da9c047ee',

    rarimoApiUrl: config.RARIMO_CORE_URL.beta,
    rarimoEvmRpcApiUrl: config.RARIMO_EVM_RPC_URL.beta,
    rarimoStateContractAddress: config.RARIMO_STATE_CONTRACT_ADDRESS.beta,

    rarimoNetworkType: 'beta',
  },
};

export const HOSTNAMES_WHITELIST = [
  // Local
  'localhost',
  // Staging
  'dashboard.stage.rarime.com',
  'app.stage.rarime.com',
  // Production
  'dashboard.rarime.com',
  'app.rarime.com',
];

export const CERAMIC_URL = 'https://ceramic.rarimo.com';
