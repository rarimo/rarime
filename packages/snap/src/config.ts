export const config = {
  AUTH_BJJ_CREDENTIAL_HASH: 'cca3371a6cb1b715004407e325bd993c',
  ID_TYPE: Uint8Array.from([1, 0]),

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
