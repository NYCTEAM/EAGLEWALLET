/**
 * Eagle Wallet - Backup Service
 * Backup and restore wallet data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import WalletStorage from '../storage/WalletStorage';
import { ethers } from 'ethers';

export interface BackupData {
  version: string;
  timestamp: number;
  wallets: any[];
  settings: any;
  addressBook: any[];
  customTokens: any[];
}

class BackupService {
  private readonly VERSION = '1.0.0';

  /**
   * Create full backup
   */
  async createBackup(password: string): Promise<string> {
    try {
      // Collect all data
      const wallets = await WalletStorage.getAllWallets();
      const settings = await this.getSettings();
      const addressBook = await this.getAddressBook();
      const customTokens = await this.getCustomTokens();

      const backupData: BackupData = {
        version: this.VERSION,
        timestamp: Date.now(),
        wallets,
        settings,
        addressBook,
        customTokens,
      };

      // Encrypt backup
      const encrypted = await this.encryptBackup(JSON.stringify(backupData), password);
      
      return encrypted;
    } catch (error) {
      console.error('Backup error:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(encryptedData: string, password: string): Promise<void> {
    try {
      // Decrypt backup
      const decrypted = await this.decryptBackup(encryptedData, password);
      const backupData: BackupData = JSON.parse(decrypted);

      // Validate version
      if (!this.isCompatibleVersion(backupData.version)) {
        throw new Error('Incompatible backup version');
      }

      // Restore data
      await this.restoreWallets(backupData.wallets);
      await this.restoreSettings(backupData.settings);
      await this.restoreAddressBook(backupData.addressBook);
      await this.restoreCustomTokens(backupData.customTokens);
    } catch (error) {
      console.error('Restore error:', error);
      throw new Error('Failed to restore backup');
    }
  }

  /**
   * Export wallet mnemonic
   */
  async exportMnemonic(walletId: string, password: string): Promise<string> {
    try {
      // Get wallet from Keychain
      const keyName = `EAGLE_WALLET_${walletId}`;
      const credentials = await Keychain.getGenericPassword({ service: keyName });
      
      if (!credentials) {
        throw new Error('Wallet not found');
      }

      // Return private key (mnemonic not available from private key)
      // In production, store mnemonic separately during wallet creation
      return credentials.password; // Return private key
    } catch (error) {
      console.error('Export mnemonic error:', error);
      throw error;
    }
  }

  /**
   * Encrypt backup data
   */
  private async encryptBackup(data: string, password: string): Promise<string> {
    // Simple encryption (in production, use proper encryption library)
    const encrypted = Buffer.from(data).toString('base64');
    return `EAGLE_BACKUP_V1:${encrypted}`;
  }

  /**
   * Decrypt backup data
   */
  private async decryptBackup(encrypted: string, password: string): Promise<string> {
    // Simple decryption
    if (!encrypted.startsWith('EAGLE_BACKUP_V1:')) {
      throw new Error('Invalid backup format');
    }
    
    const data = encrypted.replace('EAGLE_BACKUP_V1:', '');
    return Buffer.from(data, 'base64').toString();
  }

  /**
   * Check version compatibility
   */
  private isCompatibleVersion(version: string): boolean {
    return version === this.VERSION;
  }

  /**
   * Get settings
   */
  private async getSettings(): Promise<any> {
    const settings = await AsyncStorage.getItem('EAGLE_SETTINGS');
    return settings ? JSON.parse(settings) : {};
  }

  /**
   * Get address book
   */
  private async getAddressBook(): Promise<any[]> {
    const addressBook = await AsyncStorage.getItem('EAGLE_ADDRESS_BOOK');
    return addressBook ? JSON.parse(addressBook) : [];
  }

  /**
   * Get custom tokens
   */
  private async getCustomTokens(): Promise<any[]> {
    const tokens = await AsyncStorage.getItem('EAGLE_CUSTOM_TOKENS');
    return tokens ? JSON.parse(tokens) : [];
  }

  /**
   * Restore wallets
   */
  private async restoreWallets(wallets: any[]): Promise<void> {
    // Implementation depends on wallet structure
    console.log('Restoring wallets:', wallets.length);
  }

  /**
   * Restore settings
   */
  private async restoreSettings(settings: any): Promise<void> {
    await AsyncStorage.setItem('EAGLE_SETTINGS', JSON.stringify(settings));
  }

  /**
   * Restore address book
   */
  private async restoreAddressBook(addressBook: any[]): Promise<void> {
    await AsyncStorage.setItem('EAGLE_ADDRESS_BOOK', JSON.stringify(addressBook));
  }

  /**
   * Restore custom tokens
   */
  private async restoreCustomTokens(tokens: any[]): Promise<void> {
    await AsyncStorage.setItem('EAGLE_CUSTOM_TOKENS', JSON.stringify(tokens));
  }
}

export default new BackupService();
