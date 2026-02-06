/**
 * Eagle Wallet - Multi Wallet Service
 * Manage multiple wallet accounts
 */

import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import WalletStorage, { WalletAccount } from '../storage/WalletStorage';

class MultiWalletService {
  private static readonly KEY_PREFIX = 'EAGLE_WALLET_';

  /**
   * Generate wallet key for Keychain storage
   */
  private getWalletKey(walletId: string): string {
    return `${MultiWalletService.KEY_PREFIX}${walletId}`;
  }

  /**
   * Generate random wallet color
   */
  private generateWalletColor(): string {
    const colors = [
      '#F3BA2F', // Gold
      '#627EEA', // Blue
      '#26A17B', // Green
      '#F7931A', // Orange
      '#2775CA', // Light Blue
      '#E53935', // Red
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Create new wallet
   */
  async createWallet(name: string, password: string): Promise<WalletAccount> {
    try {
      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();
      const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store private key in Keychain
      const keyName = this.getWalletKey(walletId);
      await Keychain.setGenericPassword(keyName, wallet.privateKey, {
        service: keyName,
      });

      // Create wallet account
      const account: WalletAccount = {
        id: walletId,
        name: name || `Wallet ${await WalletStorage.getWalletCount() + 1}`,
        address: wallet.address,
        type: 'mnemonic',
        isDefault: false,
        createdAt: Date.now(),
        color: this.generateWalletColor(),
      };

      // Save to storage
      await WalletStorage.addWallet(account);

      return account;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  /**
   * Import wallet from mnemonic
   */
  async importFromMnemonic(
    name: string,
    mnemonic: string,
    password: string
  ): Promise<WalletAccount> {
    try {
      // Validate and create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if wallet already exists
      const exists = await WalletStorage.walletExists(wallet.address);
      if (exists) {
        throw new Error('Wallet already exists');
      }

      // Store private key in Keychain
      const keyName = this.getWalletKey(walletId);
      await Keychain.setGenericPassword(keyName, wallet.privateKey, {
        service: keyName,
      });

      // Create wallet account
      const account: WalletAccount = {
        id: walletId,
        name: name || `Imported Wallet ${await WalletStorage.getWalletCount() + 1}`,
        address: wallet.address,
        type: 'mnemonic',
        isDefault: false,
        createdAt: Date.now(),
        color: this.generateWalletColor(),
      };

      // Save to storage
      await WalletStorage.addWallet(account);

      return account;
    } catch (error) {
      console.error('Error importing from mnemonic:', error);
      throw error;
    }
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(
    name: string,
    privateKey: string,
    password: string
  ): Promise<WalletAccount> {
    try {
      // Validate and create wallet from private key
      const wallet = new ethers.Wallet(privateKey);
      const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if wallet already exists
      const exists = await WalletStorage.walletExists(wallet.address);
      if (exists) {
        throw new Error('Wallet already exists');
      }

      // Store private key in Keychain
      const keyName = this.getWalletKey(walletId);
      await Keychain.setGenericPassword(keyName, wallet.privateKey, {
        service: keyName,
      });

      // Create wallet account
      const account: WalletAccount = {
        id: walletId,
        name: name || `Imported Wallet ${await WalletStorage.getWalletCount() + 1}`,
        address: wallet.address,
        type: 'privateKey',
        isDefault: false,
        createdAt: Date.now(),
        color: this.generateWalletColor(),
      };

      // Save to storage
      await WalletStorage.addWallet(account);

      return account;
    } catch (error) {
      console.error('Error importing from private key:', error);
      throw error;
    }
  }

  /**
   * Add watch-only wallet
   */
  async addWatchWallet(name: string, address: string): Promise<WalletAccount> {
    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid address');
      }

      // Check if wallet already exists
      const exists = await WalletStorage.walletExists(address);
      if (exists) {
        throw new Error('Wallet already exists');
      }

      const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create wallet account (no private key for watch-only)
      const account: WalletAccount = {
        id: walletId,
        name: name || `Watch Wallet ${await WalletStorage.getWalletCount() + 1}`,
        address: address,
        type: 'watch',
        isDefault: false,
        createdAt: Date.now(),
        color: this.generateWalletColor(),
      };

      // Save to storage
      await WalletStorage.addWallet(account);

      return account;
    } catch (error) {
      console.error('Error adding watch wallet:', error);
      throw error;
    }
  }

  /**
   * Get all wallets
   */
  async getAllWallets(): Promise<WalletAccount[]> {
    return await WalletStorage.getAllWallets();
  }

  /**
   * Get active wallet
   */
  async getActiveWallet(): Promise<WalletAccount | null> {
    return await WalletStorage.getActiveWallet();
  }

  /**
   * Switch to wallet
   */
  async switchWallet(walletId: string): Promise<void> {
    await WalletStorage.setActiveWallet(walletId);
  }

  /**
   * Rename wallet
   */
  async renameWallet(walletId: string, newName: string): Promise<void> {
    await WalletStorage.updateWallet(walletId, { name: newName });
  }

  /**
   * Delete wallet
   */
  async deleteWallet(walletId: string, password: string): Promise<void> {
    try {
      // Get wallet info
      const wallet = await WalletStorage.getWallet(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Don't delete if it's a watch-only wallet, just remove from storage
      if (wallet.type !== 'watch') {
        // Delete private key from Keychain
        const keyName = this.getWalletKey(walletId);
        await Keychain.resetGenericPassword({ service: keyName });
      }

      // Remove from storage
      await WalletStorage.deleteWallet(walletId);
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  /**
   * Export private key
   */
  async exportPrivateKey(walletId: string, password: string): Promise<string> {
    try {
      const wallet = await WalletStorage.getWallet(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.type === 'watch') {
        throw new Error('Cannot export private key from watch-only wallet');
      }

      // Get private key from Keychain
      const keyName = this.getWalletKey(walletId);
      const credentials = await Keychain.getGenericPassword({ service: keyName });
      
      if (!credentials) {
        throw new Error('Private key not found');
      }

      return credentials.password;
    } catch (error) {
      console.error('Error exporting private key:', error);
      throw error;
    }
  }

  /**
   * Get wallet instance for transactions
   */
  async getWalletInstance(walletId: string): Promise<ethers.Wallet | null> {
    try {
      const wallet = await WalletStorage.getWallet(walletId);
      if (!wallet) {
        return null;
      }

      if (wallet.type === 'watch') {
        throw new Error('Cannot create wallet instance from watch-only wallet');
      }

      // Get private key from Keychain
      const keyName = this.getWalletKey(walletId);
      const credentials = await Keychain.getGenericPassword({ service: keyName });
      
      if (!credentials) {
        throw new Error('Private key not found');
      }

      return new ethers.Wallet(credentials.password);
    } catch (error) {
      console.error('Error getting wallet instance:', error);
      return null;
    }
  }

  /**
   * Set default wallet
   */
  async setDefaultWallet(walletId: string): Promise<void> {
    await WalletStorage.setDefaultWallet(walletId);
  }

  /**
   * Get wallet count
   */
  async getWalletCount(): Promise<number> {
    return await WalletStorage.getWalletCount();
  }
}

export default new MultiWalletService();
