export type AppCurrency = {
  readonly coinDenom: string;
  readonly coinMinimalDenom: string;
  readonly coinDecimals: number;
  /**
   * This is used to fetch asset's fiat value from coingecko.
   * You can get id from https://api.coingecko.com/api/v3/coins/list.
   */
  readonly coinGeckoId?: string;
  readonly coinImageUrl?: string;
};

export type Bech32Config = {
  readonly bech32PrefixAccAddr: string;
  readonly bech32PrefixAccPub?: string;
  readonly bech32PrefixValAddr?: string;
  readonly bech32PrefixValPub?: string;
  readonly bech32PrefixConsAddr?: string;
  readonly bech32PrefixConsPub?: string;
};

type GasPriceStep = {
  low: number;
  average: number;
  high: number;
};

export type FeeCurrency = {
  readonly coinDenom: string;
  readonly coinMinimalDenom: string;
  readonly coinDecimals: number;
  /**
   * This is used to fetch asset's fiat value from coingecko.
   * You can get id from https://api.coingecko.com/api/v3/coins/list.
   */
  readonly coinGeckoId?: string;
  readonly coinImageUrl?: string;
  readonly gasPriceStep?: GasPriceStep;
};

export type ChainInfo = {
  readonly rpc: string;
  readonly rest: string;
  readonly chainId: string;
  readonly chainName: string;
  /**
   * This indicates the type of coin that can be used for stake.
   * You can get actual currency information from Currencies.
   */
  readonly stakeCurrency?: AppCurrency;
  readonly bip44: {
    coinType: number;
  };
  readonly bech32Config: Bech32Config;

  readonly currencies: AppCurrency[];
  /**
   * This indicates which coin or token can be used for fee to send transaction.
   * You can get actual currency information from Currencies.
   */
  readonly feeCurrencies: FeeCurrency[];

  chainSymbolImageUrl: string;

  beta?: boolean;

  /**
   * ZKP integration
   */
  rpcEvm: string;
  stateContractAddress: string;
};

export type ChainZkpInfo = {
  targetChainId: number;
  targetRpcUrl: string;
  targetStateContractAddress: string;

  coreChainId: string;
};
