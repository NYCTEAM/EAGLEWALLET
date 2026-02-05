/**
 * Eagle Wallet - Network Configuration
 * Only BSC and XLAYER Mainnet supported
 */

export interface RPCNode {
  name: string;        // 显示给用户的名称
  url: string;         // 实际 RPC URL（隐藏）
  region?: string;     // 地区标识
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];           // 内部使用
  rpcNodes: RPCNode[];         // 显示给用户
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
    rpcNodes: [
      { name: 'Eagle US Node', url: EAGLE_BSC_RPC_US, region: 'US' },
      { name: 'Eagle HK Node', url: EAGLE_BSC_RPC_HK, region: 'HK' },
      { name: 'Binance LlamaRPC', url: 'https://binance.llamarpc.com', region: 'Global' },
      { name: 'BSC DRPC', url: 'https://bsc.drpc.org', region: 'Global' },
      { name: 'BSC BloxRoute', url: 'https://bsc.rpc.blxrbdn.com', region: 'Global' },
      { name: 'BSC Blockrazor', url: 'https://bsc.blockrazor.xyz', region: 'Global' },
      { name: 'Ankr BSC', url: 'https://rpc.ankr.com/bsc', region: 'Global' },
      { name: 'Binance Node 1', url: 'https://bsc-dataseed1.binance.org', region: 'Global' },
      { name: 'Binance Node 2', url: 'https://bsc-dataseed2.binance.org', region: 'Global' },
      { name: 'Binance Node 3', url: 'https://bsc-dataseed3.binance.org', region: 'Global' },
      { name: 'Binance Node 4', url: 'https://bsc-dataseed4.binance.org', region: 'Global' },
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
    rpcNodes: [
      { name: 'X Layer Official', url: 'https://rpc.xlayer.tech', region: 'Global' },
      { name: 'OKX RPC', url: 'https://xlayerrpc.okx.com', region: 'Global' },
      { name: 'Ankr X Layer', url: 'https://rpc.ankr.com/xlayer', region: 'Global' },
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
