/**
 * Eagle Wallet - Swap Mining Service
 * Record swap mining and fetch user rewards/transactions.
 */

import ApiBaseService from './ApiBaseService';

export interface SwapMiningRecordPayload {
  txHash: string;
  userAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  tradeValueUsdt: number;
  chainId: number;
  routeInfo?: string;
  fromTokenSymbol?: string;
  toTokenSymbol?: string;
  swapType?: 'instant' | 'twap' | 'limit';
  fromTokenDecimals?: number;
  toTokenDecimals?: number;
  dexName?: string;
}

export interface SwapMiningRecordResponse {
  success: boolean;
  data?: {
    eagleReward?: number;
    multiplier?: number;
  };
  eagleReward?: number;
  multiplier?: number;
  error?: string;
}

export interface SwapMiningTransactionsResponse {
  success: boolean;
  data?: {
    transactions: any[];
    total: number;
  };
  error?: string;
}

class SwapMiningService {
  async recordSwap(payload: SwapMiningRecordPayload): Promise<SwapMiningRecordResponse | null> {
    try {
      const response = await ApiBaseService.fetchApi('/api/swap-mining/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as SwapMiningRecordResponse;
      return data;
    } catch (error) {
      console.warn('Swap mining record failed:', error);
      return null;
    }
  }

  async getUserTransactions(address: string, limit: number = 50): Promise<SwapMiningTransactionsResponse | null> {
    try {
      const response = await ApiBaseService.fetchApi(`/api/swap-mining/transactions/${address}?limit=${limit}`, {
        method: 'GET',
      });
      return (await response.json()) as SwapMiningTransactionsResponse;
    } catch (error) {
      console.warn('Swap mining transactions fetch failed:', error);
      return null;
    }
  }
}

export default new SwapMiningService();
