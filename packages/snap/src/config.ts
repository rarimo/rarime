import { ChainInfo } from './types';

export const config = {
  AUTH_BJJ_CREDENTIAL_HASH: 'cca3371a6cb1b715004407e325bd993c',
  ID_TYPE: Uint8Array.from([1, 0]),

  RARIMO_EVM_RPC_URL: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
  RARIMO_CORE_URL: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
  RARIMO_STATE_CONTRACT_ADDRESS: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',

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
}

export const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  [CHAINS.Sepolia]: {
    id: CHAINS.Sepolia,
    rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    stateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',
  },
};
