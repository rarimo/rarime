import type { ChainInfo, ChainZkpInfo } from '@/types';

enum CoreChains {
  Mainnet = 'rarimo_201411-1',
  MainnetBeta = 'rarimo_42-1',
}

export const CORE_CHAINS: Record<string, ChainInfo> = {
  [CoreChains.MainnetBeta]: {
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
    rpcEvm: 'https://rpc.evm.node1.mainnet-beta.rarimo.com',
    stateContractAddress: '0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8',
  },
  [CoreChains.Mainnet]: {
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
    beta: false,
    rpcEvm: 'https://rpc.evm.mainnet.rarimo.com',
    stateContractAddress: '0x5ac96945a771d417B155Cb07A3D7E4b8e2F33FdE',
  },
};

enum TargetChains {
  EthereumMainet = 1,
  Bsc = 56,
  Polygon = 137,
  Avalance = 43114,
  Sepolia = 11155111,
  Goerly = 5,
}

export const TARGET_CHAINS: Record<number, ChainZkpInfo> = {
  [TargetChains.Polygon]: {
    targetChainId: TargetChains.Polygon,
    targetRpcUrl: 'https://polygon-rpc.com',
    targetStateContractAddress: '0xf9bA419ad9c82451d31d89917db61253a1e46B3C',

    coreChainId: CoreChains.Mainnet,
  },
  [TargetChains.EthereumMainet]: {
    targetChainId: TargetChains.EthereumMainet,
    targetRpcUrl: 'https://eth.llamarpc.com',
    targetStateContractAddress: '0xB11D49e873A1B4a8c54520A9b6a3c8E017AfE7BB',

    coreChainId: CoreChains.Mainnet,
  },
  [TargetChains.Bsc]: {
    targetChainId: TargetChains.Bsc,
    targetRpcUrl: 'https://bsc-dataseed.binance.org',
    targetStateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',

    coreChainId: CoreChains.Mainnet,
  },
  [TargetChains.Avalance]: {
    targetChainId: TargetChains.Avalance,
    targetRpcUrl: 'https://avax.meowrpc.com',
    targetStateContractAddress: '0xF3e2491627b9eF3816A4143010B39B2B67F33E55',

    coreChainId: CoreChains.Mainnet,
  },
  [TargetChains.Sepolia]: {
    targetChainId: TargetChains.Sepolia,
    targetRpcUrl: 'https://endpoints.omniatech.io/v1/eth/sepolia/public',
    targetStateContractAddress: '0x8a9F505bD8a22BF09b0c19F65C17426cd33f3912',

    coreChainId: CoreChains.MainnetBeta,
  },
  [TargetChains.Goerly]: {
    targetChainId: TargetChains.Goerly,
    targetRpcUrl: 'https://ethereum-goerli.publicnode.com',
    targetStateContractAddress: '0x0F08e8EA245E63F2090Bf3fF3772402Da9c047ee',

    coreChainId: CoreChains.MainnetBeta,
  },
};
