/**
 * Eagle Wallet - Core Wallet Service
 * Handles wallet creation, import, and management
 */

import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NETWORKS, DEFAULT_NETWORK } from '../config/networks';
import RPCService from './RPCService';
import BiometricAuthService from './BiometricAuthService';

const WALLET_KEY = 'EAGLE_WALLET_KEY';
const WALLET_ADDRESS_KEY = 'EAGLE_WALLET_ADDRESS';
const WALLET_MNEMONIC_KEY = 'EAGLE_WALLET_MNEMONIC';
const WALLET_PASSWORD_HASH_KEY = 'EAGLE_PASSWORD_HASH';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

class WalletService {
  private wallet: ethers.Wallet | ethers.HDNodeWallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private currentChainId: number = DEFAULT_NETWORK;
  private currentRpcUrl: string | null = null;
  private lastProviderCheck: number = 0;
  private refreshingProvider: boolean = false;

  private hashPassword(password: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(password));
  }

  private async setPasswordHash(password: string): Promise<void> {
    await AsyncStorage.setItem(WALLET_PASSWORD_HASH_KEY, this.hashPassword(password));
  }

  private async getStoredAddress(): Promise<string | null> {
    return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
  }

  private async setStoredAddress(address: string): Promise<void> {
    await AsyncStorage.setItem(WALLET_ADDRESS_KEY, address);
  }

  private async initProvider(chainId: number): Promise<void> {
    const resolvedChainId = NETWORKS[chainId] ? chainId : DEFAULT_NETWORK;
    const network = NETWORKS[resolvedChainId];

    try {
      const preferredRpc = await RPCService.getPreferredRpcUrl(resolvedChainId);
      this.provider = new ethers.JsonRpcProvider(preferredRpc, {
        chainId: network.chainId,
        name: network.name,
      });
      this.currentRpcUrl = preferredRpc;
    } catch {
      this.provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
        chainId: network.chainId,
        name: network.name,
      });
      this.currentRpcUrl = network.rpcUrls[0];
    }

    if (this.wallet && this.provider) {
      this.wallet = this.wallet.connect(this.provider);
    }

    this.currentChainId = resolvedChainId;
    this.lastProviderCheck = Date.now();
  }

  private async refreshProviderIfNeeded(force: boolean = false): Promise<void> {
    if (this.refreshingProvider) return;
    const now = Date.now();
    if (!force && now - this.lastProviderCheck < 60 * 1000) {
      return;
    }

    this.refreshingProvider = true;
    this.lastProviderCheck = now;
    try {
      const preferredRpc = await RPCService.getPreferredRpcUrl(this.currentChainId);
      if (!this.provider || !this.currentRpcUrl || preferredRpc !== this.currentRpcUrl) {
        const network = NETWORKS[this.currentChainId] || NETWORKS[DEFAULT_NETWORK];
        this.provider = new ethers.JsonRpcProvider(preferredRpc, {
          chainId: network.chainId,
          name: network.name,
        });
        this.currentRpcUrl = preferredRpc;
        if (this.wallet) {
          this.wallet = this.wallet.connect(this.provider);
        }
      }
    } catch (error) {
      console.warn('Failed to refresh provider:', error);
    } finally {
      this.refreshingProvider = false;
    }
  }

  /**
   * Require biometric or device credential confirmation when enabled.
   */
  async authorizeSensitiveAction(reason: string): Promise<void> {
    await BiometricAuthService.ensureAuthenticated(reason);
  }

  /**
   * Create a new wallet
   */
  async createWallet(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const newWallet = ethers.Wallet.createRandom();
    const mnemonic = newWallet.mnemonic?.phrase;

    if (!mnemonic) {
      throw new Error('Failed to generate mnemonic');
    }

    await Keychain.setGenericPassword(WALLET_KEY, newWallet.privateKey);
    await Keychain.setGenericPassword(WALLET_MNEMONIC_KEY, mnemonic, { service: WALLET_MNEMONIC_KEY });
    await this.setPasswordHash(password);
    await this.setStoredAddress(newWallet.address);

    this.wallet = newWallet;
    await this.initProvider(DEFAULT_NETWORK);

    return mnemonic;
  }

  /**
   * Import wallet from mnemonic
   */
  async importFromMnemonic(mnemonic: string, password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());

    await Keychain.setGenericPassword(WALLET_KEY, wallet.privateKey);
    await Keychain.setGenericPassword(WALLET_MNEMONIC_KEY, mnemonic.trim(), { service: WALLET_MNEMONIC_KEY });
    await this.setPasswordHash(password);
    await this.setStoredAddress(wallet.address);

    this.wallet = wallet;
    await this.initProvider(DEFAULT_NETWORK);

    return wallet.address;
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(privateKey: string, password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const wallet = new ethers.Wallet(privateKey.trim());

    await Keychain.setGenericPassword(WALLET_KEY, wallet.privateKey);
    await Keychain.resetGenericPassword({ service: WALLET_MNEMONIC_KEY });
    await this.setPasswordHash(password);
    await this.setStoredAddress(wallet.address);

    this.wallet = wallet;
    await this.initProvider(DEFAULT_NETWORK);

    return wallet.address;
  }

  /**
   * Unlock wallet with password
   */
  async unlockWallet(password: string): Promise<boolean> {
    const valid = await this.verifyPassword(password);
    if (!valid) {
      return false;
    }

    const credentials = await Keychain.getGenericPassword();
    if (!credentials) {
      return false;
    }

    this.wallet = new ethers.Wallet(credentials.password);
    await this.initProvider(this.currentChainId);
    return true;
  }

  /**
   * Initialize wallet from secure storage
   */
  async init(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (!credentials) {
        return false;
      }

      this.wallet = new ethers.Wallet(credentials.password);
      await this.initProvider(this.currentChainId);
      return true;
    } catch {
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
   * Get wallet address (works in read-only mode too)
   */
  async getAddress(): Promise<string | null> {
    if (this.wallet) {
      return this.wallet.address;
    }
    return await this.getStoredAddress();
  }

  /**
   * Get signer wallet
   */
  async getWallet(): Promise<ethers.Wallet | ethers.HDNodeWallet> {
    if (!this.wallet) {
      await this.init();
    }

    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    } else {
      await this.refreshProviderIfNeeded();
    }

    this.wallet = this.wallet.connect(this.provider!);
    return this.wallet;
  }

  /**
   * Get current provider
   */
  async getProvider(): Promise<ethers.Provider> {
    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    } else {
      await this.refreshProviderIfNeeded();
    }
    return this.provider!;
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId: number): Promise<void> {
    await this.initProvider(chainId);
  }

  /**
   * Ensure provider uses preferred RPC (force refresh if needed).
   */
  async ensurePreferredProvider(force: boolean = false): Promise<void> {
    if (!this.provider) {
      await this.initProvider(this.currentChainId);
      return;
    }
    await this.refreshProviderIfNeeded(force);
  }

  /**
   * Get balance for current active address
   */
  async getBalance(): Promise<string> {
    const address = await this.getAddress();
    if (!address) {
      return '0.0';
    }

    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    }

    try {
      const balance = await this.provider!.getBalance(address);
      return ethers.formatEther(balance);
    } catch {
      return '0.0';
    }
  }

  /**
   * Send native transaction
   */
  async sendTransaction(to: string, amount: string, gasPrice?: string): Promise<string> {
    if (!ethers.isAddress(to)) {
      throw new Error('Invalid recipient address');
    }

    await this.authorizeSensitiveAction('Confirm transaction');

    const signer = await this.getWallet();

    const txOptions: any = {
      to,
      value: ethers.parseEther(amount),
    };

    if (gasPrice) {
      txOptions.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
    }

    const tx = await signer.sendTransaction(txOptions);

    await Promise.race([
      tx.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 300000)
      ),
    ]);

    return tx.hash;
  }

  /**
   * Send ERC20 token
   */
  async sendToken(tokenAddress: string, to: string, amount: string, decimals: number = 18): Promise<string> {
    if (!ethers.isAddress(to)) {
      throw new Error('Invalid recipient address');
    }

    await this.authorizeSensitiveAction('Confirm token transfer');

    const signer = await this.getWallet();

    const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    const contract = new ethers.Contract(tokenAddress, abi, signer);
    const parsedAmount = ethers.parseUnits(amount, decimals);

    const tx = await contract.transfer(to, parsedAmount);

    await Promise.race([
      tx.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 300000)
      ),
    ]);

    return tx.hash;
  }

  /**
   * Get basic transaction history by scanning recent blocks
   */
  async getTransactionHistory(limit: number = 20): Promise<any[]> {
    const address = await this.getAddress();
    if (!address) {
      return [];
    }

    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    }

    const currentBlock = await this.provider!.getBlockNumber();
    const history: any[] = [];

    for (let i = 0; i < Math.min(limit, 100); i++) {
      const block = await this.provider!.getBlock(currentBlock - i, true);
      if (!block || !block.transactions) {
        continue;
      }

      for (const txData of block.transactions) {
        if (typeof txData === 'string') {
          continue;
        }

        const tx = txData as any;
        const from = (tx.from || '').toLowerCase();
        const to = (tx.to || '').toLowerCase();
        const mine = address.toLowerCase();

        if (from === mine || to === mine) {
          history.push({
            hash: tx.hash || '',
            from: tx.from || '',
            to: tx.to || '',
            value: ethers.formatEther(tx.value || 0),
            timestamp: block.timestamp,
          });
        }
      }

      if (history.length >= limit) {
        break;
      }
    }

    return history.slice(0, limit);
  }

  /**
   * Get current network config
   */
  getCurrentNetwork() {
    return NETWORKS[this.currentChainId] || NETWORKS[DEFAULT_NETWORK];
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    await this.authorizeSensitiveAction('Sign message');
    const signer = await this.getWallet();
    return await signer.signMessage(message);
  }

  /**
   * Sign EIP-712 typed data
   */
  async signTypedData(
    domain: Record<string, any>,
    types: Record<string, Array<{ name: string; type: string }>>,
    message: Record<string, any>
  ): Promise<string> {
    await this.authorizeSensitiveAction('Sign typed data');
    const signer = await this.getWallet();
    return await signer.signTypedData(domain, types, message);
  }

  /**
   * Export private key (requires password)
   */
  async exportPrivateKey(password: string): Promise<string> {
    await this.authorizeSensitiveAction('Export private key');
    const valid = await this.verifyPassword(password);
    if (!valid) {
      throw new Error('Incorrect password');
    }

    const credentials = await Keychain.getGenericPassword();
    if (!credentials) {
      throw new Error('No wallet found');
    }

    return credentials.password;
  }

  /**
   * Export mnemonic phrase (requires password)
   */
  async exportMnemonic(password: string): Promise<string> {
    await this.authorizeSensitiveAction('Export recovery phrase');
    const valid = await this.verifyPassword(password);
    if (!valid) {
      throw new Error('Incorrect password');
    }

    const mnemonicCredentials = await Keychain.getGenericPassword({ service: WALLET_MNEMONIC_KEY });
    if (mnemonicCredentials && mnemonicCredentials.password) {
      return mnemonicCredentials.password;
    }

    throw new Error('Mnemonic not available for this wallet');
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string): Promise<boolean> {
    const storedHash = await AsyncStorage.getItem(WALLET_PASSWORD_HASH_KEY);
    if (storedHash) {
      return this.hashPassword(password) === storedHash;
    }

    const credentials = await Keychain.getGenericPassword();
    return !!credentials;
  }

  /**
   * Change password hash for wallet security operations
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const valid = await this.verifyPassword(oldPassword);
    if (!valid) {
      return false;
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    await this.setPasswordHash(newPassword);
    return true;
  }

  /**
   * Switch active signer wallet from private key
   */
  async setActiveWalletFromPrivateKey(privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    await Keychain.setGenericPassword(WALLET_KEY, wallet.privateKey);
    await this.setStoredAddress(wallet.address);

    this.wallet = wallet;

    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    } else {
      this.wallet = this.wallet.connect(this.provider);
    }

    return wallet.address;
  }

  /**
   * Set active read-only address (watch wallet mode)
   */
  async setReadOnlyAddress(address: string): Promise<void> {
    await this.setStoredAddress(address);
    this.wallet = null;

    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    }
  }

  /**
   * Check if active wallet is read-only
   */
  isReadOnly(): boolean {
    return this.wallet === null;
  }

  /**
   * Check if address owns a specific NFT
   */
  async hasNFT(contractAddress: string): Promise<boolean> {
    const address = await this.getAddress();
    if (!address) {
      return false;
    }

    if (!this.provider) {
      await this.initProvider(this.currentChainId);
    }

    try {
      const abi = ['function balanceOf(address owner) view returns (uint256)'];
      const contract = new ethers.Contract(contractAddress, abi, this.provider!);
      const balance = await contract.balanceOf(address);
      return balance > 0n;
    } catch {
      return false;
    }
  }

  /**
   * Delete wallet and clear security metadata
   */
  async deleteWallet(): Promise<void> {
    await Keychain.resetGenericPassword();
    await Keychain.resetGenericPassword({ service: WALLET_MNEMONIC_KEY });
    await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
    await AsyncStorage.removeItem(WALLET_PASSWORD_HASH_KEY);

    this.wallet = null;
    this.provider = null;
  }
}

export default new WalletService();
