/**
 * Eagle Wallet - Transaction Service
 * Manage transaction history and details
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';
import RPCService from './RPCService';

const PENDING_TXS_KEY = 'EAGLE_PENDING_TXS';
const BSCSCAN_API_KEY = '';

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
  swapReward?: number;
  swapRoute?: string;
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
  async getTransactionHistory(address: string, chainId: number, limit: number = 50): Promise<Transaction[]> {
    try {
      if (chainId === 56) {
        const explorerTxs = await this.getBscTransactions(address, limit);
        if (explorerTxs.length > 0) {
          return explorerTxs;
        }
      }

      return this.getRpcTransactions(address, chainId, limit);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  private async getBscTransactions(address: string, limit: number): Promise<Transaction[]> {
    try {
      const keyPart = BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : '';
      const url =
        `https://api.bscscan.com/api?module=account&action=txlist` +
        `&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc${keyPart}`;

      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (data.status !== '1' || !Array.isArray(data.result)) {
        return [];
      }

      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: Number(tx.timeStamp) * 1000,
        status: tx.txreceipt_status === '1' ? 'success' : 'failed',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        nonce: Number(tx.nonce),
        chainId: 56,
        blockNumber: Number(tx.blockNumber),
        confirmations: Number(tx.confirmations),
      }));
    } catch (error) {
      console.error('Error fetching BSC transactions:', error);
      return [];
    }
  }

  private async getRpcTransactions(address: string, chainId: number, limit: number): Promise<Transaction[]> {
    const network = NETWORKS[chainId];
    if (!network) {
      return [];
    }

    try {
      const rpcUrl = await RPCService.getPreferredRpcUrl(chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl, {
        chainId: network.chainId,
        name: network.name,
      });

      const currentBlock = await provider.getBlockNumber();
      const maxLookback = Math.max(limit * 40, 1200);
      const minBlock = Math.max(0, currentBlock - maxLookback);
      const normalizedAddress = address.toLowerCase();
      const history: Transaction[] = [];

      for (let blockNumber = currentBlock; blockNumber >= minBlock; blockNumber--) {
        if (history.length >= limit) {
          break;
        }

        const block = await provider.getBlock(blockNumber, true);
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

          if (from !== normalizedAddress && to !== normalizedAddress) {
            continue;
          }

          const receipt = await provider.getTransactionReceipt(tx.hash).catch(() => null);
          const status: 'pending' | 'success' | 'failed' =
            !receipt ? 'pending' : receipt.status === 1 ? 'success' : 'failed';

          history.push({
            hash: tx.hash,
            from: tx.from || '',
            to: tx.to || '',
            value: tx.value ? tx.value.toString() : '0',
            timestamp: Number(block.timestamp) * 1000,
            status,
            gasUsed: receipt?.gasUsed?.toString(),
            gasPrice: tx.gasPrice?.toString(),
            nonce: Number(tx.nonce || 0),
            chainId,
            blockNumber: tx.blockNumber || undefined,
            confirmations: tx.blockNumber ? currentBlock - tx.blockNumber + 1 : undefined,
          });

          if (history.length >= limit) {
            break;
          }
        }
      }

      return history;
    } catch (error) {
      console.error('Error fetching RPC transactions:', error);
      return [];
    }
  }

  async getTransactionDetail(
    txHash: string,
    chainId: number,
    provider: ethers.Provider
  ): Promise<Transaction | null> {
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!tx) {
        return null;
      }

      let timestamp = Date.now();
      if (tx.blockNumber != null) {
        const block = await provider.getBlock(tx.blockNumber);
        if (block) {
          timestamp = Number(block.timestamp) * 1000;
        }
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        timestamp,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        gasUsed: receipt?.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString(),
        nonce: tx.nonce,
        chainId,
        blockNumber: tx.blockNumber || undefined,
        confirmations: tx.blockNumber != null ? await tx.confirmations() : undefined,
      };
    } catch (error) {
      console.error('Error getting transaction detail:', error);
      return null;
    }
  }

  async addPendingTransaction(tx: Transaction): Promise<void> {
    try {
      const pending = await this.getPendingTransactions();
      pending.push(tx);
      await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending transaction:', error);
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const txsJson = await AsyncStorage.getItem(PENDING_TXS_KEY);
      if (!txsJson) {
        return [];
      }
      return JSON.parse(txsJson);
    } catch {
      return [];
    }
  }

  async updateTransactionStatus(txHash: string, status: 'success' | 'failed'): Promise<void> {
    try {
      const pending = await this.getPendingTransactions();
      const tx = pending.find((item) => item.hash === txHash);
      if (tx) {
        tx.status = status;
      }
      const filtered = pending.filter((item) => item.hash !== txHash);
      await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }

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

  async clearOldPendingTransactions(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const pending = await this.getPendingTransactions();
      const now = Date.now();
      const filtered = pending.filter((tx) => now - tx.timestamp < maxAge);
      await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error clearing old transactions:', error);
    }
  }
}

export default new TransactionService();
