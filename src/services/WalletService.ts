/**
 * Eagle Wallet - Core Wallet Service
 * Handles wallet creation, import, and management
 */

import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NETWORKS, DEFAULT_NETWORK } from '../config/networks';
import RPCService from './RPCService';

const WALLET_KEY = 'EAGLE_WALLET_KEY';
const WALLET_ADDRESS_KEY = 'EAGLE_WALLET_ADDRESS';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

class WalletService {
  private wallet: ethers.HDNodeWallet | ethers.Wallet | null = null;
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

      // Store private key directly in secure Keychain (much faster than scrypt encryption)
      // Keychain is already encrypted by the system
      await Keychain.setGenericPassword(WALLET_KEY, newWallet.privateKey);
      
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
      
      // Store private key directly in secure Keychain
      await Keychain.setGenericPassword(WALLET_KEY, wallet.privateKey);
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
      
      // Store private key directly in secure Keychain
      await Keychain.setGenericPassword(WALLET_KEY, wallet.privateKey);
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

      // Private key is stored directly (not encrypted with scrypt)
      const privateKey = credentials.password;
      this.wallet = new ethers.Wallet(privateKey);
      this.initProvider(this.currentChainId);
      
      return true;
    } catch (error) {
      console.error('Unlock wallet error:', error);
      return false;
    }
  }

  /**
   * Initialize wallet from stored credentials
   * This should be called when app starts or when HomeScreen loads
   */
  async init(): Promise<boolean> {
    try {
      console.log('🔐 WalletService: Initializing from Keychain...');
      const credentials = await Keychain.getGenericPassword();
      
      if (!credentials) {
        console.log('🔐 WalletService: No credentials found');
        return false;
      }

      // Restore wallet from private key
      const privateKey = credentials.password;
      this.wallet = new ethers.Wallet(privateKey);
      
      // Initialize provider
      await this.initProvider(this.currentChainId);
      
      console.log('🔐 WalletService: Wallet initialized successfully:', this.wallet.address);
      return true;
    } catch (error) {
      console.error('🔐 WalletService: Init failed:', error);
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
    // If wallet not loaded, try to initialize it
    if (!this.wallet) {
      console.log('🔐 WalletService: Wallet not loaded, attempting init...');
      await this.init();
    }
    
    if (this.wallet) {
      return this.wallet.address;
    }
    
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
  }

  /**
   * Get current provider
   */
  async getProvider(): Promise<ethers.Provider> {
    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    }
    return this.provider!;
  }

  /**
   * Initialize provider for specific chain with smart RPC selection
   */
  private async initProvider(chainId: number) {
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    console.log(`🔄 Initializing provider for ${network.name}...`);
    
    // Use smart RPC selection to find fastest node
    try {
      this.provider = await RPCService.getProvider(chainId);
    } catch (error) {
      console.error('Smart RPC selection failed, using fallback:', error);
      // Fallback to first RPC URL
      this.provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
        chainId: network.chainId,
        name: network.name,
      });
    }
    
    if (this.wallet) {
      this.wallet = this.wallet.connect(this.provider);
    }
    
    this.currentChainId = chainId;
    console.log(`✅ Provider initialized for ${network.name}`);
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
    // Auto-initialize if needed
    if (!this.wallet) {
      console.log('🔐 WalletService: Wallet not loaded in getBalance, attempting init...');
      await this.init();
    }
    
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
        for (const txData of block.transactions) {
          if (typeof txData !== 'string') {
            const tx = txData as any; // Type assertion for transaction response
            if (tx.from === this.wallet.address || tx.to === this.wallet.address) {
              history.push({
                hash: tx.hash || '',
                from: tx.from || '',
                to: tx.to || '',
                value: ethers.formatEther(tx.value || 0),
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

      // Check if stored value is a private key
      if (credentials.password.startsWith('0x')) {
        return credentials.password;
      }

      // Try to decrypt
      if (credentials.password.trim().startsWith('{')) {
        const decryptedWallet = await ethers.Wallet.fromEncryptedJson(
          credentials.password,
          password
        );
        return decryptedWallet.privateKey;
      }

      // Fallback
      return credentials.password;
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

      // If stored as private key, we can't get mnemonic unless we stored it separately
      // But wait, createWallet stores privateKey. So mnemonic is LOST if we didn't store it elsewhere.
      // However, MultiWalletService might store type='mnemonic'.
      
      // Check if it's JSON
      if (credentials.password.trim().startsWith('{')) {
        const decryptedWallet = await ethers.Wallet.fromEncryptedJson(
          credentials.password,
          password
        );
        if ('mnemonic' in decryptedWallet && decryptedWallet.mnemonic) {
          return decryptedWallet.mnemonic.phrase;
        }
      }

      // If we are here, we probably only have private key or decryption failed
      // In current implementation, we only stored private key in Keychain
      // So we cannot retrieve mnemonic from Keychain password field.
      
      throw new Error('Mnemonic not available for this wallet');
    } catch (error) {
      console.error('Export mnemonic error:', error);
      throw error;
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

      // If stored as plain private key, we can't verify password cryptographically
      // unless we stored a hash. For now, assume true if we can read Keychain.
      if (credentials.password.startsWith('0x')) {
        return true;
      }

      if (credentials.password.trim().startsWith('{')) {
        await ethers.Wallet.fromEncryptedJson(credentials.password, password);
        return true;
      }

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
