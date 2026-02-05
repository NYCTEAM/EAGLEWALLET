/**
 * Eagle Wallet - Network Configuration
 * Only BSC and XLAYER Mainnet supported
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrl: string;
  logo: string;
  color: string;
}

// Eagle RPC nodes with smart switching (US/HK)
const EAGLE_BSC_RPC_US = 'https://bsc.eagleswap.io'; // US node
const EAGLE_BSC_RPC_HK = 'https://bsc.eagleswap.llc/26119c762d57f906602c2d4bed374e05bab696dccdd2c8708cfacd4303f71c5f'; // HK node

export const NETWORKS: Record<number, NetworkConfig> = {
  // BSC Mainnet
  56: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrls: [
      EAGLE_BSC_RPC_US,      // Eagle US node (primary)
      EAGLE_BSC_RPC_HK,      // Eagle HK node (backup)
      'https://binance.llamarpc.com',
      'https://bsc.drpc.org',
      'https://bsc.rpc.blxrbdn.com',
      'https://bsc.blockrazor.xyz',
      'https://rpc.ankr.com/bsc',
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed4.binance.org',
    ],
    blockExplorerUrl: 'https://bscscan.com',
    logo: 'bnb',
    color: '#F3BA2F',
  },
  
  // XLAYER Mainnet
  196: {
    chainId: 196,
    name: 'X Layer',
    symbol: 'OKB',
    decimals: 18,
    rpcUrls: [
      'https://rpc.xlayer.tech',
      'https://xlayerrpc.okx.com',
      'https://rpc.ankr.com/xlayer',
    ],
    blockExplorerUrl: 'https://www.oklink.com/xlayer',
    logo: 'okx',
    color: '#000000',
  },
};

export const DEFAULT_NETWORK = 56; // BSC as default

export const SUPPORTED_CHAIN_IDS = [56, 196];

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORKS[chainId];
}

export function isNetworkSupported(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}
