/**
 * Eagle Wallet - Core Wallet Service
 * Handles wallet creation, import, and management
 */

import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NETWORKS, DEFAULT_NETWORK } from '../config/networks';

const WALLET_KEY = 'EAGLE_WALLET_KEY';
const WALLET_ADDRESS_KEY = 'EAGLE_WALLET_ADDRESS';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

class WalletService {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private currentChainId: number = DEFAULT_NETWORK;

  /**
   * Create a new wallet
   */
  async createWallet(password: string): Promise<string> {
    try {
      // Generate new wallet
      const newWallet = ethers.Wallet.createRandom();
      const mnemonic = newWallet.mnemonic?.phrase;
      
      if (!mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }

      // Encrypt and store private key
      const encryptedKey = await newWallet.encrypt(password);
      await Keychain.setGenericPassword(WALLET_KEY, encryptedKey);
      
      // Store address
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, newWallet.address);
      
      this.wallet = newWallet;
      this.initProvider(DEFAULT_NETWORK);
      
      return mnemonic;
    } catch (error) {
      console.error('Create wallet error:', error);
      throw error;
    }
  }

  /**
   * Import wallet from mnemonic
   */
  async importFromMnemonic(mnemonic: string, password: string): Promise<string> {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      
      // Encrypt and store
      const encryptedKey = await wallet.encrypt(password);
      await Keychain.setGenericPassword(WALLET_KEY, encryptedKey);
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, wallet.address);
      
      this.wallet = wallet;
      this.initProvider(DEFAULT_NETWORK);
      
      return wallet.address;
    } catch (error) {
      console.error('Import from mnemonic error:', error);
      throw error;
    }
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(privateKey: string, password: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      
      // Encrypt and store
      const encryptedKey = await wallet.encrypt(password);
      await Keychain.setGenericPassword(WALLET_KEY, encryptedKey);
      await AsyncStorage.setItem(WALLET_ADDRESS_KEY, wallet.address);
      
      this.wallet = wallet;
      this.initProvider(DEFAULT_NETWORK);
      
      return wallet.address;
    } catch (error) {
      console.error('Import from private key error:', error);
      throw error;
    }
  }

  /**
   * Unlock wallet with password
   */
  async unlockWallet(password: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        throw new Error('No wallet found');
      }

      const encryptedKey = credentials.password;
      this.wallet = await ethers.Wallet.fromEncryptedJson(encryptedKey, password);
      this.initProvider(this.currentChainId);
      
      return true;
    } catch (error) {
      console.error('Unlock wallet error:', error);
      return false;
    }
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    const credentials = await Keychain.getGenericPassword();
    return !!credentials;
  }

  /**
   * Get wallet address
   */
  async getAddress(): Promise<string | null> {
    if (this.wallet) {
      return this.wallet.address;
    }
    return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
  }

  /**
   * Initialize provider for specific chain
   */
  private initProvider(chainId: number) {
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    // Try multiple RPC URLs for redundancy
    this.provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
      chainId: network.chainId,
      name: network.name,
    });
    
    if (this.wallet) {
      this.wallet = this.wallet.connect(this.provider);
    }
    
    this.currentChainId = chainId;
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId: number): Promise<void> {
    this.initProvider(chainId);
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<string> {
    if (!this.wallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Send transaction
   */
  async sendTransaction(to: string, amount: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const tx = await this.wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });

    await tx.wait();
    return tx.hash;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(limit: number = 20): Promise<any[]> {
    if (!this.wallet || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    // This is a simplified version
    // In production, you'd use block explorer APIs
    const currentBlock = await this.provider.getBlockNumber();
    const history: any[] = [];

    // Scan recent blocks for transactions
    for (let i = 0; i < Math.min(limit, 100); i++) {
      const block = await this.provider.getBlock(currentBlock - i, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (typeof tx !== 'string') {
            if (tx.from === this.wallet.address || tx.to === this.wallet.address) {
              history.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                timestamp: block.timestamp,
              });
            }
          }
        }
      }
      if (history.length >= limit) break;
    }

    return history;
  }

  /**
   * Get current network info
   */
  getCurrentNetwork() {
    return NETWORKS[this.currentChainId];
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return await this.wallet.signMessage(message);
  }

  /**
   * Export private key (requires password verification)
   */
  async exportPrivateKey(password: string): Promise<string> {
    try {
      // Get encrypted wallet
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        throw new Error('No wallet found');
      }

      // Decrypt wallet with password
      const decryptedWallet = await ethers.Wallet.fromEncryptedJson(
        credentials.password,
        password
      );

      return decryptedWallet.privateKey;
    } catch (error) {
      console.error('Export private key error:', error);
      throw new Error('Incorrect password or wallet not found');
    }
  }

  /**
   * Export mnemonic phrase (requires password verification)
   */
  async exportMnemonic(password: string): Promise<string> {
    try {
      // Get encrypted wallet
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        throw new Error('No wallet found');
      }

      // Decrypt wallet with password
      const decryptedWallet = await ethers.Wallet.fromEncryptedJson(
        credentials.password,
        password
      );

      const mnemonic = decryptedWallet.mnemonic?.phrase;
      if (!mnemonic) {
        throw new Error('This wallet was imported with private key and has no mnemonic');
      }

      return mnemonic;
    } catch (error) {
      console.error('Export mnemonic error:', error);
      throw new Error('Incorrect password or wallet not found');
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        return false;
      }

      await ethers.Wallet.fromEncryptedJson(credentials.password, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(): Promise<void> {
    await Keychain.resetGenericPassword();
    await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
    this.wallet = null;
    this.provider = null;
  }
}

export default new WalletService();
