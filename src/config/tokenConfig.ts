/**
 * Eagle Wallet - Token Configuration
 * Predefined mainstream tokens with logos for BSC and XLAYER
 */

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  color: string;
  logo?: string; // Local asset path
  chainId: number;
}

// BSC Mainnet (56) - Mainstream Tokens
export const BSC_TOKENS: TokenConfig[] = [
  {
    address: '0x480F12D2ECEFe1660e72149c57327f5E0646E5c4',
    symbol: 'EAGLE',
    name: 'Eagle Token',
    decimals: 18,
    icon: '🦅',
    color: '#F3BA2F',
    logo: 'eagle',
    chainId: 56,
  },
  {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    icon: '₮',
    color: '#26A17B',
    logo: 'usdt',
    chainId: 56,
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
    icon: '$',
    color: '#2775CA',
    logo: 'usdc',
    chainId: 56,
  },
  {
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    symbol: 'BUSD',
    name: 'Binance USD',
    decimals: 18,
    icon: '$',
    color: '#F0B90B',
    logo: 'busd',
    chainId: 56,
  },
  {
    address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    icon: '◈',
    color: '#F5AC37',
    logo: 'dai',
    chainId: 56,
  },
  {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
    logo: 'eth',
    chainId: 56,
  },
  {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    name: 'Bitcoin BEP2',
    decimals: 18,
    icon: '₿',
    color: '#F7931A',
    logo: 'btcb',
    chainId: 56,
  },
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    icon: 'W',
    color: '#F3BA2F',
    logo: 'wbnb',
    chainId: 56,
  },
  {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    decimals: 18,
    icon: '🥞',
    color: '#D1884F',
    logo: 'cake',
    chainId: 56,
  },
  {
    address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
    symbol: 'USD1',
    name: 'USD1 Token',
    decimals: 18,
    icon: '$',
    color: '#00D395',
    logo: 'usd1',
    chainId: 56,
  },
  {
    address: '0xce24439f2d9c6a2289f741120fe202248b666666',
    symbol: 'USDS',
    name: 'Sperax USD',
    decimals: 18,
    icon: '$',
    color: '#FFFFFF',
    logo: 'usds',
    chainId: 56,
  },
];

// XLAYER Mainnet (196) - Mainstream Tokens
export const XLAYER_TOKENS: TokenConfig[] = [
  {
    address: '0x5a746ee9933627ed79822d35a3fe812eddd5ba37',
    symbol: 'EAGLE',
    name: 'Eagle Token',
    decimals: 18,
    icon: '🦅',
    color: '#F3BA2F',
    logo: 'eagle',
    chainId: 196,
  },
  {
    address: '0x779ded0c9e1022225f8e0630b35a9b54be713736',
    symbol: 'USDT0',
    name: 'Tether USD (Old)',
    decimals: 6,
    icon: '₮',
    color: '#26A17B',
    logo: 'usdt0',
    chainId: 196,
  },
  {
    address: '0x1e4a5963abfd975d8c9021ce480b42188849d41d',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '₮',
    color: '#26A17B',
    logo: 'usdt',
    chainId: 196,
  },
  {
    address: '0xe538905cf8410324e03A5A23C1c177a474D59b2b',
    symbol: 'WOKB',
    name: 'Wrapped OKB',
    decimals: 18,
    icon: 'W',
    color: '#000000',
    logo: 'wokb',
    chainId: 196,
  },
  {
    address: '0x5A77f1443D16ee5761d310e38b62f77f726bC71c',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
    logo: 'weth',
    chainId: 196,
  },
];

// All tokens by chain ID
export const TOKENS_BY_CHAIN: Record<number, TokenConfig[]> = {
  56: BSC_TOKENS,
  196: XLAYER_TOKENS,
};

/**
 * Get token config by address and chain
 */
export function getTokenConfig(address: string, chainId: number): TokenConfig | undefined {
  const tokens = TOKENS_BY_CHAIN[chainId] || [];
  return tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
}

/**
 * Get all tokens for a chain
 */
export function getChainTokens(chainId: number): TokenConfig[] {
  return TOKENS_BY_CHAIN[chainId] || [];
}

/**
 * Check if token is in predefined list
 */
export function isKnownToken(address: string, chainId: number): boolean {
  return !!getTokenConfig(address, chainId);
}
