/**
 * Eagle Wallet - DApps Configuration
 * Predefined DApps and Swap Providers
 */

export interface DApp {
  name: string;
  description: string;
  url: string;
  category: string;
  icon?: string;
  added?: boolean;
}

export interface SwapProvider {
  key: string;
  name: string;
  url: string;
  logoURI: string;
}

// Featured DApps
export const FEATURED_DAPPS: DApp[] = [
  {
    name: 'Eagle Swap',
    description: 'Official Eagle Swap DApp - Trade tokens with best rates',
    url: 'https://eagleswap.llc/swap',
    category: 'Exchange',
    icon: '🦅',
    added: true,
  },
  {
    name: 'PancakeSwap',
    description: 'The most popular DEX on BSC',
    url: 'https://pancakeswap.finance/',
    category: 'Exchange',
    icon: '🥞',
  },
  {
    name: 'Uniswap',
    description: 'Leading decentralized exchange',
    url: 'https://app.uniswap.org/',
    category: 'Exchange',
    icon: '🦄',
  },
  {
    name: '1inch',
    description: 'DeFi aggregator with best swap rates',
    url: 'https://app.1inch.io/',
    category: 'Exchange',
    icon: '🔷',
  },
  {
    name: 'OpenOcean',
    description: 'Full aggregation protocol for crypto trading',
    url: 'https://openocean.finance/',
    category: 'Exchange',
    icon: '🌊',
  },
  {
    name: 'Aave',
    description: 'Decentralized lending protocol',
    url: 'https://app.aave.com/',
    category: 'DeFi',
    icon: '👻',
  },
  {
    name: 'Compound',
    description: 'Algorithmic money market protocol',
    url: 'https://app.compound.finance/',
    category: 'DeFi',
    icon: '🏦',
  },
];

// Swap Providers
export const SWAP_PROVIDERS: SwapProvider[] = [
  {
    key: 'eagleswap',
    name: 'Eagle Swap',
    url: 'https://eagleswap.llc/',
    logoURI: 'https://eagleswap.llc/logo.png',
  },
  {
    key: 'pancakeswap',
    name: 'PancakeSwap',
    url: 'https://pancakeswap.finance/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/pancake.png',
  },
  {
    key: '1inch',
    name: '1inch',
    url: 'https://1inch.io/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/oneinch.png',
  },
  {
    key: 'uniswap',
    name: 'UniswapV2',
    url: 'https://uniswap.org/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/uniswap.png',
  },
  {
    key: 'sushiswap',
    name: 'SushiSwap',
    url: 'https://sushi.com/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/sushi.png',
  },
  {
    key: 'openocean',
    name: 'OpenOcean',
    url: 'https://openocean.finance/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/openocean.png',
  },
  {
    key: 'paraswap',
    name: 'ParaSwap',
    url: 'https://www.paraswap.io/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/paraswap.png',
  },
  {
    key: 'dodo',
    name: 'DODO',
    url: 'https://dodoex.io/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/dodo.png',
  },
  {
    key: '0x',
    name: '0x',
    url: 'https://www.0x.org/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/zerox.png',
  },
  {
    key: 'quickswap',
    name: 'QuickSwap',
    url: 'https://quickswap.exchange/',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/quick.png',
  },
];

// DApp Categories
export const DAPP_CATEGORIES = [
  'All',
  'Exchange',
  'DeFi',
  'NFT',
  'Gaming',
  'Social',
  'Tools',
];

/**
 * Get DApps by category
 */
export function getDAppsByCategory(category: string): DApp[] {
  if (category === 'All') {
    return FEATURED_DAPPS;
  }
  return FEATURED_DAPPS.filter(dapp => dapp.category === category);
}

/**
 * Get swap provider by key
 */
export function getSwapProvider(key: string): SwapProvider | undefined {
  return SWAP_PROVIDERS.find(provider => provider.key === key);
}

/**
 * Search DApps by name or description
 */
export function searchDApps(query: string): DApp[] {
  const lowerQuery = query.toLowerCase();
  return FEATURED_DAPPS.filter(
    dapp =>
      dapp.name.toLowerCase().includes(lowerQuery) ||
      dapp.description.toLowerCase().includes(lowerQuery)
  );
}
