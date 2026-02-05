/**
 * Eagle Wallet - DApp Service
 * Manage DApp connections and Web3 provider
 */

import { ethers } from 'ethers';
import WalletService from './WalletService';

export interface DApp {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: 'defi' | 'nft' | 'game' | 'social' | 'other';
  chainId: number;
  featured?: boolean;
}

// Pre-configured popular DApps
export const FEATURED_DAPPS: DApp[] = [
  // BSC DApps
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    url: 'https://pancakeswap.finance',
    icon: '🥞',
    description: 'Leading DEX on BSC',
    category: 'defi',
    chainId: 56,
    featured: true,
  },
  {
    id: 'venus',
    name: 'Venus Protocol',
    url: 'https://app.venus.io',
    icon: '♀️',
    description: 'Lending & Borrowing',
    category: 'defi',
    chainId: 56,
    featured: true,
  },
  {
    id: 'biswap',
    name: 'Biswap',
    url: 'https://biswap.org',
    icon: '🦎',
    description: 'Low fee DEX',
    category: 'defi',
    chainId: 56,
  },
  {
    id: 'thena',
    name: 'Thena',
    url: 'https://www.thena.fi',
    icon: '⚡',
    description: 'Next-gen DEX',
    category: 'defi',
    chainId: 56,
  },
  // XLAYER DApps
  {
    id: 'okx-dex',
    name: 'OKX DEX',
    url: 'https://www.okx.com/web3/dex-swap',
    icon: '🔷',
    description: 'OKX Decentralized Exchange',
    category: 'defi',
    chainId: 196,
    featured: true,
  },
  {
    id: 'xlayer-bridge',
    name: 'X Layer Bridge',
    url: 'https://www.okx.com/xlayer/bridge',
    icon: '🌉',
    description: 'Bridge assets to X Layer',
    category: 'defi',
    chainId: 196,
    featured: true,
  },
  // NFT Marketplaces
  {
    id: 'nftrade',
    name: 'NFTrade',
    url: 'https://nftrade.com',
    icon: '🎨',
    description: 'Multi-chain NFT marketplace',
    category: 'nft',
    chainId: 56,
  },
  {
    id: 'element',
    name: 'Element',
    url: 'https://element.market',
    icon: '💎',
    description: 'NFT aggregator',
    category: 'nft',
    chainId: 56,
  },
];

class DAppService {
  private customDApps: DApp[] = [];
  private recentDApps: DApp[] = [];

  /**
   * Get all DApps for a specific chain
   */
  getDAppsForChain(chainId: number): DApp[] {
    const featured = FEATURED_DAPPS.filter(dapp => dapp.chainId === chainId);
    const custom = this.customDApps.filter(dapp => dapp.chainId === chainId);
    return [...featured, ...custom];
  }

  /**
   * Get featured DApps
   */
  getFeaturedDApps(chainId?: number): DApp[] {
    let dapps = FEATURED_DAPPS.filter(dapp => dapp.featured);
    if (chainId) {
      dapps = dapps.filter(dapp => dapp.chainId === chainId);
    }
    return dapps;
  }

  /**
   * Get DApps by category
   */
  getDAppsByCategory(category: string, chainId?: number): DApp[] {
    let dapps = [...FEATURED_DAPPS, ...this.customDApps].filter(
      dapp => dapp.category === category
    );
    if (chainId) {
      dapps = dapps.filter(dapp => dapp.chainId === chainId);
    }
    return dapps;
  }

  /**
   * Add custom DApp
   */
  addCustomDApp(dapp: Omit<DApp, 'id'>): DApp {
    const newDApp: DApp = {
      ...dapp,
      id: `custom-${Date.now()}`,
    };
    this.customDApps.push(newDApp);
    return newDApp;
  }

  /**
   * Remove custom DApp
   */
  removeCustomDApp(id: string): boolean {
    const index = this.customDApps.findIndex(dapp => dapp.id === id);
    if (index > -1) {
      this.customDApps.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get custom DApps
   */
  getCustomDApps(): DApp[] {
    return this.customDApps;
  }

  /**
   * Add to recent DApps
   */
  addToRecent(dapp: DApp): void {
    // Remove if already exists
    this.recentDApps = this.recentDApps.filter(d => d.id !== dapp.id);
    // Add to front
    this.recentDApps.unshift(dapp);
    // Keep only last 10
    if (this.recentDApps.length > 10) {
      this.recentDApps = this.recentDApps.slice(0, 10);
    }
  }

  /**
   * Get recent DApps
   */
  getRecentDApps(): DApp[] {
    return this.recentDApps;
  }

  /**
   * Search DApps
   */
  searchDApps(query: string): DApp[] {
    const lowerQuery = query.toLowerCase();
    return [...FEATURED_DAPPS, ...this.customDApps].filter(
      dapp =>
        dapp.name.toLowerCase().includes(lowerQuery) ||
        dapp.description.toLowerCase().includes(lowerQuery) ||
        dapp.url.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Web3 provider for DApp
   */
  async getWeb3Provider() {
    const network = WalletService.getCurrentNetwork();
    return {
      chainId: `0x${network.chainId.toString(16)}`,
      networkVersion: network.chainId.toString(),
      isEagleWallet: true,
      isMetaMask: true, // For compatibility
    };
  }
}

export default new DAppService();
