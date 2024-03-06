import type { ChainInfo } from '@/wallet/types';

export const CHAINS: Record<string, ChainInfo> = {
  'rarimo_42-1': {
    chainId: 'rarimo_42-1',
    chainName: 'Rarimo Testnet',
    chainSymbolImageUrl:
      'https://raw.githubusercontent.com/rarimo/js-sdk/2.0.0-rc.14/assets/logos/ra-dark-logo.png',
    rpc: 'https://rpc.node1.mainnet-beta.rarimo.com',
    rest: 'https://rpc-api.node1.mainnet-beta.rarimo.com',
    stakeCurrency: {
      coinDenom: 'STAKE',
      coinMinimalDenom: 'stake',
      coinDecimals: 6,
    },
    currencies: [
      {
        coinDenom: 'STAKE',
        coinMinimalDenom: 'stake',
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: 'STAKE',
        coinMinimalDenom: 'stake',
        coinDecimals: 6,
        gasPriceStep: {
          low: 0,
          average: 0.1,
          high: 0.5,
        },
      },
    ],
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: 'rarimo',
      bech32PrefixAccPub: 'rarimopub',
      bech32PrefixValAddr: 'rarimovaloper',
      bech32PrefixValPub: 'rarimovaloperpub',
      bech32PrefixConsAddr: 'rarimovalcons',
      bech32PrefixConsPub: 'rarimovalconspub',
    },
    beta: true,
  },
  'rarimo_201411-1': {
    chainId: 'rarimo_201411-1',
    chainName: 'Rarimo',
    chainSymbolImageUrl:
      'https://raw.githubusercontent.com/rarimo/js-sdk/2.0.0-rc.14/assets/logos/ra-dark-logo.png',
    rpc: 'https://rpc.mainnet.rarimo.com',
    rest: 'https://rpc-api.mainnet.rarimo.com',
    stakeCurrency: {
      coinDenom: 'RMO',
      coinMinimalDenom: 'urmo',
      coinDecimals: 6,
    },
    currencies: [
      {
        coinDenom: 'RMO',
        coinMinimalDenom: 'urmo',
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: 'RMO',
        coinMinimalDenom: 'urmo',
        coinDecimals: 6,
        gasPriceStep: {
          low: 0,
          average: 0.1,
          high: 0.5,
        },
      },
    ],
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: 'rarimo',
      bech32PrefixAccPub: 'rarimopub',
      bech32PrefixValAddr: 'rarimovaloper',
      bech32PrefixValPub: 'rarimovaloperpub',
      bech32PrefixConsAddr: 'rarimovalcons',
      bech32PrefixConsPub: 'rarimovalconspub',
    },
    beta: true,
  },
};
