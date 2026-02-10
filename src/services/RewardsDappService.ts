/**
 * Eagle Wallet - Rewards DApp Service
 * Smart selection between global CDN and HK direct rewards page.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { REWARDS_DAPP_URLS } from '../config/rewardsDapp';

const CACHE_KEY = 'EAGLE_REWARDS_DAPP_URL';
const CACHE_TS_KEY = 'EAGLE_REWARDS_DAPP_URL_TS';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_TIMEOUT_MS = 2500;

type RewardsSelection = {
  url: string;
  latencyMs: number;
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  );
  return (await Promise.race([
    fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } }),
    timeoutPromise,
  ])) as Response;
}

async function probeRewards(url: string, timeoutMs: number): Promise<RewardsSelection | null> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) return null;
    return { url, latencyMs: Date.now() - start };
  } catch {
    return null;
  }
}

class RewardsDappService {
  private static memoryUrl: string | null = null;
  private static memoryTs = 0;
  private static selecting: Promise<string> | null = null;

  static async prewarm(): Promise<void> {
    try {
      await this.getRewardsUrl();
    } catch (error) {
      console.warn('Rewards prewarm failed:', error);
    }
  }

  static async getRewardsUrl(options?: { forceRefresh?: boolean; timeoutMs?: number }): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const forceRefresh = !!options?.forceRefresh;

    if (!forceRefresh) {
      const cached = await this.getCachedUrl();
      if (cached) return cached;
    }

    if (this.selecting) return this.selecting;

    this.selecting = (async () => {
      const probes = await Promise.all(
        REWARDS_DAPP_URLS.map((url) => probeRewards(url, timeoutMs))
      );
      const ok = probes.filter((p): p is RewardsSelection => !!p);
      ok.sort((a, b) => a.latencyMs - b.latencyMs);
      const selected = ok[0]?.url || REWARDS_DAPP_URLS[0];
      await this.saveCache(selected);
      return selected;
    })();

    try {
      return await this.selecting;
    } finally {
      this.selecting = null;
    }
  }

  private static async getCachedUrl(): Promise<string | null> {
    if (this.memoryUrl && Date.now() - this.memoryTs < CACHE_TTL_MS) {
      return this.memoryUrl;
    }

    try {
      const [urlEntry, tsEntry] = await AsyncStorage.multiGet([CACHE_KEY, CACHE_TS_KEY]);
      const cachedUrl = urlEntry?.[1] || null;
      const cachedTs = tsEntry?.[1] ? parseInt(tsEntry[1], 10) : 0;

      if (
        cachedUrl &&
        REWARDS_DAPP_URLS.includes(cachedUrl) &&
        Date.now() - cachedTs < CACHE_TTL_MS
      ) {
        this.memoryUrl = cachedUrl;
        this.memoryTs = cachedTs;
        return cachedUrl;
      }
    } catch (error) {
      console.warn('Failed to read rewards URL cache:', error);
    }

    return null;
  }

  private static async saveCache(url: string): Promise<void> {
    this.memoryUrl = url;
    this.memoryTs = Date.now();
    try {
      await AsyncStorage.multiSet([
        [CACHE_KEY, url],
        [CACHE_TS_KEY, String(this.memoryTs)],
      ]);
    } catch (error) {
      console.warn('Failed to save rewards URL cache:', error);
    }
  }
}

export default RewardsDappService;
