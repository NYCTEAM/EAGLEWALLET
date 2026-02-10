/**
 * Eagle Wallet - DApp Service
 * Manage DApp catalog and Web3 provider metadata.
 */

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

// BSC-only featured DApps
export const FEATURED_DAPPS: DApp[] = [
  {
    id: 'eagleswap-hk',
    name: 'EAGLE SWAP - HK',
    url: 'https://eagleswap.llc',
    icon: 'eagle',
    description: 'Eagle Swap (HK direct)',
    category: 'defi',
    chainId: 56,
    featured: true,
  },
  {
    id: 'eagleswap-global',
    name: 'EAGLE SWAP - Global',
    url: 'https://eagleswap.io',
    icon: 'eagle',
    description: 'Eagle Swap (Global CDN)',
    category: 'defi',
    chainId: 56,
    featured: true,
  },
];

class DAppService {
  private customDApps: DApp[] = [];
  private recentDApps: DApp[] = [];

  getDAppsForChain(chainId: number): DApp[] {
    const featured = FEATURED_DAPPS.filter((dapp) => dapp.chainId === chainId);
    const custom = this.customDApps.filter((dapp) => dapp.chainId === chainId);
    return [...featured, ...custom];
  }

  getFeaturedDApps(chainId?: number): DApp[] {
    let dapps = FEATURED_DAPPS.filter((dapp) => dapp.featured);
    if (chainId) {
      dapps = dapps.filter((dapp) => dapp.chainId === chainId);
    }
    return dapps;
  }

  getDAppsByCategory(category: string, chainId?: number): DApp[] {
    let dapps = [...FEATURED_DAPPS, ...this.customDApps].filter(
      (dapp) => dapp.category === category
    );
    if (chainId) {
      dapps = dapps.filter((dapp) => dapp.chainId === chainId);
    }
    return dapps;
  }

  addCustomDApp(dapp: Omit<DApp, 'id'>): DApp {
    const newDApp: DApp = {
      ...dapp,
      id: `custom-${Date.now()}`,
    };
    this.customDApps.push(newDApp);
    return newDApp;
  }

  removeCustomDApp(id: string): boolean {
    const index = this.customDApps.findIndex((dapp) => dapp.id === id);
    if (index > -1) {
      this.customDApps.splice(index, 1);
      return true;
    }
    return false;
  }

  getCustomDApps(): DApp[] {
    return this.customDApps;
  }

  addToRecent(dapp: DApp): void {
    this.recentDApps = this.recentDApps.filter((item) => item.id !== dapp.id);
    this.recentDApps.unshift(dapp);
    if (this.recentDApps.length > 10) {
      this.recentDApps = this.recentDApps.slice(0, 10);
    }
  }

  getRecentDApps(): DApp[] {
    return this.recentDApps;
  }

  searchDApps(query: string): DApp[] {
    const lower = query.toLowerCase();
    return [...FEATURED_DAPPS, ...this.customDApps].filter(
      (dapp) =>
        dapp.name.toLowerCase().includes(lower) ||
        dapp.description.toLowerCase().includes(lower) ||
        dapp.url.toLowerCase().includes(lower)
    );
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async getWeb3Provider() {
    const network = WalletService.getCurrentNetwork();
    return {
      chainId: `0x${network.chainId.toString(16)}`,
      networkVersion: network.chainId.toString(),
      isEagleWallet: true,
      isMetaMask: true,
    };
  }
}

export default new DAppService();
