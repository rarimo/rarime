export enum RPCMethods {
  CreateIdentity = 'create_identity',
  SaveCredentials = 'save_credentials',
  RemoveCredentials = 'remove_credentials',
  CheckCredentialExistence = 'check_credential_existence',
  CreateProof = 'create_proof',
  CheckStateContractSync = 'check_state_contract_sync',
  GetCredentials = 'get_credentials',
  ExportIdentity = 'export_identity',
  GetIdentity = 'get_identity',

  WalletSignDirect = 'wallet_signDirect',
  WalletSignAmino = 'wallet_signAmino',
  WalletGetKey = 'wallet_getKey',
  WalletSuggestChain = 'wallet_suggestChain',
  WalletGetSupportedChains = 'wallet_getSupportedChains',
}
