/**
 * Eagle Wallet - Transaction Service
 * Manage transaction history and details
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_TXS_KEY = 'EAGLE_PENDING_TXS';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  token?: {
    address: string;
    symbol: string;
    decimals: number;
  };
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  nonce: number;
  chainId: number;
  blockNumber?: number;
  confirmations?: number;
}

class TransactionService {
  /**
   * Get transaction history from blockchain explorer API
   */
  async getTransactionHistory(
    address: string,
    chainId: number,
    limit: number = 50
  ): Promise<Transaction[]> {
    try {
      // For BSC, use BscScan API
      if (chainId === 56) {
        return await this.getBscTransactions(address, limit);
      }
      
      // For other chains, return empty for now
      // You can add more chain-specific implementations
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get BSC transactions from BscScan API
   */
  private async getBscTransactions(address: string, limit: number): Promise<Transaction[]> {
    try {
      // Note: You'll need a BscScan API key for production
      // For now, return mock data or use free tier
      const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          timestamp: parseInt(tx.timeStamp) * 1000,
          status: tx.txreceipt_status === '1' ? 'success' : 'failed',
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          nonce: parseInt(tx.nonce),
          chainId: 56,
          blockNumber: parseInt(tx.blockNumber),
          confirmations: parseInt(tx.confirmations),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching BSC transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction detail
   */
  async getTransactionDetail(
    txHash: string,
    chainId: number,
    provider: ethers.Provider
  ): Promise<Transaction | null> {
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!tx) return null;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        timestamp: Date.now(), // You'd get this from block timestamp
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        gasUsed: receipt?.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString(),
        nonce: tx.nonce,
        chainId,
        blockNumber: tx.blockNumber || undefined,
        confirmations: await tx.confirmations(),
      };
    } catch (error) {
      console.error('Error getting transaction detail:', error);
      return null;
    }
  }

  /**
   * Add pending transaction
   */
  async addPendingTransaction(tx: Transaction): Promise<void> {
    try {
      const pending = await this.getPendingTransactions();
      pending.push(tx);
      await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending transaction:', error);
    }
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const txsJson = await AsyncStorage.getItem(PENDING_TXS_KEY);
      if (!txsJson) return [];
      return JSON.parse(txsJson);
    } catch (error) {
      return [];
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    txHash: string,
    status: 'success' | 'failed'
  ): Promise<void> {
    try {
      const pending = await this.getPendingTransactions();
      const tx = pending.find(t => t.hash === txHash);
      
      if (tx) {
        tx.status = status;
        const filtered = pending.filter(t => t.hash !== txHash);
        await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }

  /**
   * Watch pending transaction
   */
  async watchPendingTransaction(
    txHash: string,
    provider: ethers.Provider,
    callback: (status: 'success' | 'failed') => void
  ): Promise<void> {
    try {
      const receipt = await provider.waitForTransaction(txHash);
      const status = receipt?.status === 1 ? 'success' : 'failed';
      await this.updateTransactionStatus(txHash, status);
      callback(status);
    } catch (error) {
      console.error('Error watching transaction:', error);
      await this.updateTransactionStatus(txHash, 'failed');
      callback('failed');
    }
  }

  /**
   * Clear old pending transactions
   */
  async clearOldPendingTransactions(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const pending = await this.getPendingTransactions();
      const now = Date.now();
      const filtered = pending.filter(tx => now - tx.timestamp < maxAge);
      await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error clearing old transactions:', error);
    }
  }
}

export default new TransactionService();
