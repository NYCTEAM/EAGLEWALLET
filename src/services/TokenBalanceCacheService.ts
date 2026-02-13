/**
 * Eagle Wallet - Token Balance Cache Service
 * Cache token balances locally to improve perceived performance (stale-while-revalidate).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'EAGLE_TOKEN_BALANCE_CACHE_V1';

type BalanceCachePayload = {
  timestamp: number;
  balances: Record<string, string>;
};

function normalize(value: string): string {
  return String(value || '').toLowerCase();
}

function storageKey(chainId: number, address: string): string {
  return `${STORAGE_PREFIX}:${chainId}:${normalize(address)}`;
}

class TokenBalanceCacheService {
  async getCachedBalances(
    chainId: number,
    address: string,
    maxAgeMs: number = 30 * 60 * 1000
  ): Promise<Record<string, string> | null> {
    const addr = String(address || '').trim();
    if (!addr) return null;

    try {
      const raw = await AsyncStorage.getItem(storageKey(chainId, addr));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as BalanceCachePayload;
      if (!parsed || typeof parsed.timestamp !== 'number' || !parsed.balances || typeof parsed.balances !== 'object') {
        return null;
      }
      if (Date.now() - parsed.timestamp > maxAgeMs) {
        return parsed.balances || null;
      }
      return parsed.balances || null;
    } catch {
      return null;
    }
  }

  async setCachedBalances(chainId: number, address: string, balances: Record<string, string>): Promise<void> {
    const addr = String(address || '').trim();
    if (!addr) return;
    try {
      const payload: BalanceCachePayload = {
        timestamp: Date.now(),
        balances: balances || {},
      };
      await AsyncStorage.setItem(storageKey(chainId, addr), JSON.stringify(payload));
    } catch {
      // ignore cache persist failures
    }
  }
}

export default new TokenBalanceCacheService();

