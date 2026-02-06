/**
 * Eagle Wallet - Wallet Storage
 * Manage multiple wallet accounts in AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLETS_KEY = 'EAGLE_WALLETS';
const ACTIVE_WALLET_KEY = 'EAGLE_ACTIVE_WALLET';

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  type: 'mnemonic' | 'privateKey' | 'watch';
  isDefault: boolean;
  createdAt: number;
  color?: string; // For UI display
}

class WalletStorage {
  /**
   * Get all wallets
   */
  async getAllWallets(): Promise<WalletAccount[]> {
    try {
      const walletsJson = await AsyncStorage.getItem(WALLETS_KEY);
      if (!walletsJson) {
        return [];
      }
      return JSON.parse(walletsJson);
    } catch (error) {
      console.error('Error getting wallets:', error);
      return [];
    }
  }

  /**
   * Add new wallet
   */
  async addWallet(wallet: WalletAccount): Promise<void> {
    try {
      const wallets = await this.getAllWallets();
      
      // If this is the first wallet, make it default
      if (wallets.length === 0) {
        wallet.isDefault = true;
      }
      
      wallets.push(wallet);
      await AsyncStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
      
      // Set as active if it's the default
      if (wallet.isDefault) {
        await this.setActiveWallet(wallet.id);
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  }

  /**
   * Update wallet
   */
  async updateWallet(walletId: string, updates: Partial<WalletAccount>): Promise<void> {
    try {
      const wallets = await this.getAllWallets();
      const index = wallets.findIndex(w => w.id === walletId);
      
      if (index === -1) {
        throw new Error('Wallet not found');
      }
      
      wallets[index] = { ...wallets[index], ...updates };
      await AsyncStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(walletId: string): Promise<void> {
    try {
      const wallets = await this.getAllWallets();
      const filtered = wallets.filter(w => w.id !== walletId);
      
      if (filtered.length === wallets.length) {
        throw new Error('Wallet not found');
      }
      
      // If deleting the default wallet, make the first remaining wallet default
      const deletedWallet = wallets.find(w => w.id === walletId);
      if (deletedWallet?.isDefault && filtered.length > 0) {
        filtered[0].isDefault = true;
        await this.setActiveWallet(filtered[0].id);
      }
      
      await AsyncStorage.setItem(WALLETS_KEY, JSON.stringify(filtered));
      
      // Clear active wallet if no wallets left
      if (filtered.length === 0) {
        await AsyncStorage.removeItem(ACTIVE_WALLET_KEY);
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<WalletAccount | null> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.find(w => w.id === walletId) || null;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  /**
   * Get wallet by address
   */
  async getWalletByAddress(address: string): Promise<WalletAccount | null> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.find(w => w.address.toLowerCase() === address.toLowerCase()) || null;
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      return null;
    }
  }

  /**
   * Set active wallet
   */
  async setActiveWallet(walletId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_WALLET_KEY, walletId);
    } catch (error) {
      console.error('Error setting active wallet:', error);
      throw error;
    }
  }

  /**
   * Get active wallet ID
   */
  async getActiveWalletId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_WALLET_KEY);
    } catch (error) {
      console.error('Error getting active wallet:', error);
      return null;
    }
  }

  /**
   * Get active wallet
   */
  async getActiveWallet(): Promise<WalletAccount | null> {
    try {
      const activeId = await this.getActiveWalletId();
      if (!activeId) {
        // Return first wallet if no active wallet set
        const wallets = await this.getAllWallets();
        return wallets[0] || null;
      }
      return await this.getWallet(activeId);
    } catch (error) {
      console.error('Error getting active wallet:', error);
      return null;
    }
  }

  /**
   * Set default wallet
   */
  async setDefaultWallet(walletId: string): Promise<void> {
    try {
      const wallets = await this.getAllWallets();
      
      // Remove default from all wallets
      wallets.forEach(w => w.isDefault = false);
      
      // Set new default
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        wallet.isDefault = true;
        await AsyncStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
        await this.setActiveWallet(walletId);
      }
    } catch (error) {
      console.error('Error setting default wallet:', error);
      throw error;
    }
  }

  /**
   * Check if wallet exists
   */
  async walletExists(address: string): Promise<boolean> {
    try {
      const wallet = await this.getWalletByAddress(address);
      return wallet !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet count
   */
  async getWalletCount(): Promise<number> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear all wallets (use with caution!)
   */
  async clearAllWallets(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WALLETS_KEY);
      await AsyncStorage.removeItem(ACTIVE_WALLET_KEY);
    } catch (error) {
      console.error('Error clearing wallets:', error);
      throw error;
    }
  }
}

export default new WalletStorage();
