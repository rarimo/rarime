import { ChainInfo } from './types';

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

export const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  [CHAINS.Polygon]: {
    id: CHAINS.Polygon,
    rpcUrl: 'https://polygon-rpc.com',
    stateContractAddress: '0xf9bA419ad9c82451d31d89917db61253a1e46B3C',
    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.EthereumMainet]: {
    id: CHAINS.EthereumMainet,
    rpcUrl: 'https://eth.llamarpc.com',
    stateContractAddress: '0xB11D49e873A1B4a8c54520A9b6a3c8E017AfE7BB',
    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.Bsc]: {
    id: CHAINS.Bsc,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    stateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',
    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.Avalance]: {
    id: CHAINS.Avalance,
    rpcUrl: 'https://avax.meowrpc.com',
    stateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',
    rarimoNetworkType: 'mainnet',
  },
  [CHAINS.Sepolia]: {
    id: CHAINS.Sepolia,
    rpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    stateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',
    rarimoNetworkType: 'beta',
  },
  [CHAINS.Goerly]: {
    id: CHAINS.Goerly,
    rpcUrl: 'https://ethereum-goerli.publicnode.com',
    stateContractAddress: '0x0F08e8EA245E63F2090Bf3fF3772402Da9c047ee',
    rarimoNetworkType: 'beta',
  },
};

export const GET_CREDENTIALS_SUPPORTED_HOSTNAMES = [
  // Local
  'localhost',
  // Staging
  'dashboard.stage.rarime.com',
  'app.staging.rarime.com',
  // Production
  'dashboard.rarime.com',
  'app.rarime.com',
];

/*
https://developers.ceramic.network/tools/glaze/deploy-from-cli/

Publish models:
1) glaze config:set ceramic-url ceramic-url(https://.....)
2) glaze model:create encrypted-data
3) glaze did:create
  Save the private key and did and then use it in --key
4) glaze model:add encrypted-data schema EncryptedCredentials '{"$schema":"http://json-schema.org/draft-07/schema#","title":"EncryptedCredentials","type":" object","properties":{"data":{"type":"string"}},"required":["data"],"additionalProperties":false}' --key=key
5) glaze model:inspect encrypted-data
  We take the schema version from there
  And insert into schema (point 6) (ceramic:// + version)
6) glaze model:add encrypted-data definition encryptedCredentials '{"name":"Encrypted credentials","description":"Encrypted verifiable credentials in Ceramic","schema":"ceramic://k3y52l7qbv1fryhxouyfmpmct2tiehvosfgkcqiqc2enafrolcq0i34ocim3p0ge8" }' --key =key
7) glaze model:deploy encrypted-data ./deployed-model.json
*/
export const CERAMIC_ALIASES = {
  definitions: {
    encryptedCredentials:
      'kjzl6cwe1jw148ogdspueenn4m3zbose42od00t7j17su653wql2rp73plm3biq',
  },
  schemas: {
    EncryptedCredentials:
      'ceramic://k3y52l7qbv1frymy245dkbe095vtpn9vqz4o5fu43gxrsu5c2h227i2ddw95y6a68',
  },
  tiles: {},
};

export const CERAMIC_URL = 'https://ceramic.rarimo.com';
