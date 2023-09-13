import { ChainInfo } from './types';

export const config = {
  AUTH_BJJ_CREDENTIAL_HASH: 'cca3371a6cb1b715004407e325bd993c',
  ID_TYPE: Uint8Array.from([1, 0]),

  RARIMO_EVM_RPC_URL: 'https://rpc.evm.mainnet.rarimo.com',
  RARIMO_CORE_URL: 'https://rpc-api.mainnet.rarimo.com',
  RARIMO_STATE_CONTRACT_ADDRESS: '0x5ac96945a771d417B155Cb07A3D7E4b8e2F33FdE',

  CIRCUIT_AUTH_WASM_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmYd41GHrKQLqbk96zHbmHU5rGVcxwmAgBpRqLCGLK7LQu',
  CIRCUIT_AUTH_FINAL_KEY_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmWKor7i9r2zbM6oqSdgPUCvgyYESH39qXk1f5tbdeaAg7',
  CIRCUIT_SIG_V2_ON_CHAIN_WASM_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmS4vURQ1c8tgALSokdTYVqx5E9FmASbu964W3JevnM3B4',
  CIRCUIT_SIG_V2_ON_CHAIN_FINAL_KEY_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmT45Y62hfZnADq6VvKGjNR8foNb2KjcyG4AStRRAN9iHm',
  CIRCUIT_SIG_V2_WASM_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmYB5QLvH5ihiedxvzkG3XPQngjxcS8wc1xCAoKnGS5GfC',
  CIRCUIT_SIG_V2_FINAL_KEY_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmeXxRXxYGCwa48ANikH5Knzi9cgkmhumPbMtjTKNYkThL',
  CIRCUIT_MTP_V2_WASM_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmRqGgnN6Qy4LuPxQKH2wrADNe4aJb8wYJhS1ky9zbLS8t',
  CIRCUIT_MTP_V2_FINAL_KEY_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmcLyDLPWJpyEWeR9KkWQuGHAqifnwpDAWBX1R6a7g6F6a',
  CIRCUIT_MTP_V2_ON_CHAIN_WASM_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmPtPiFgZigau2VNpSCoagNj36ZpuuATRNvyNPAvvUgvq6',
  CIRCUIT_MTP_V2_ON_CHAIN_FINAL_KEY_URL:
    'https://ipfs.tokend.io/ipfs/ipfs/QmU8fC3xwjMcmnsB88SrdKRZpskhxUwBRnaLMa1AcN9ERj',
};

enum CHAINS {
  EthereumMainet = 1,
  Bsc = 56,
  Polygon = 137,
  Avalance = 43114,
  Sepolia = 11155111,
  Goerly = 5,
}

export const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  [CHAINS.Polygon]: {
    id: CHAINS.Polygon,
    rpcUrl: 'https://polygon-rpc.com',
    stateContractAddress: '0xf9bA419ad9c82451d31d89917db61253a1e46B3C',
  },
  [CHAINS.EthereumMainet]: {
    id: CHAINS.EthereumMainet,
    rpcUrl: 'https://eth.llamarpc.com',
    stateContractAddress: '0xB11D49e873A1B4a8c54520A9b6a3c8E017AfE7BB',
  },
  [CHAINS.Bsc]: {
    id: CHAINS.Bsc,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    stateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',
  },
  [CHAINS.Avalance]: {
    id: CHAINS.Avalance,
    rpcUrl: 'https://avax.meowrpc.com',
    stateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',
  },
  [CHAINS.Sepolia]: {
    id: CHAINS.Sepolia,
    rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    stateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',
  },
  [CHAINS.Goerly]: {
    id: CHAINS.Goerly,
    rpcUrl: 'https://ethereum-goerli.publicnode.com',
    stateContractAddress: '0x0F08e8EA245E63F2090Bf3fF3772402Da9c047ee',
  },
};
