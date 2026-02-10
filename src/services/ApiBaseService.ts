/**
 * Eagle Wallet - API Base Service
 * Smart selection across CDN and direct HK endpoints.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASES = [
  'https://api.eagleswap.io',
  'https://www.api.eagleswap.io',
  'https://api.eagleswap.llc',
  'https://www.api.eagleswap.llc',
];

const HEALTH_PATH = '/health';
const CACHE_KEY = 'EAGLE_API_BASE_URL';
const CACHE_TS_KEY = 'EAGLE_API_BASE_URL_TS';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_TIMEOUT_MS = 2500;

type ApiBaseSelection = {
  baseUrl: string;
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

async function probeBase(baseUrl: string, timeoutMs: number): Promise<ApiBaseSelection | null> {
  const url = `${baseUrl}${HEALTH_PATH}`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) return null;
    return { baseUrl, latencyMs: Date.now() - start };
  } catch {
    return null;
  }
}

class ApiBaseService {
  private static memoryBase: string | null = null;
  private static memoryTs = 0;
  private static selecting: Promise<string> | null = null;

  static getCandidates(): string[] {
    return [...API_BASES];
  }

  static async prewarm(): Promise<void> {
    try {
      await this.getApiBaseUrl();
    } catch (error) {
      console.warn('API prewarm failed:', error);
    }
  }

  static async resetCache(): Promise<void> {
    this.memoryBase = null;
    this.memoryTs = 0;
    await AsyncStorage.multiRemove([CACHE_KEY, CACHE_TS_KEY]);
  }

  static async getApiBaseUrl(options?: {
    forceRefresh?: boolean;
    timeoutMs?: number;
  }): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const forceRefresh = !!options?.forceRefresh;

    if (!forceRefresh) {
      const cached = await this.getCachedBase();
      if (cached) return cached;
    }

    if (this.selecting) return this.selecting;

    this.selecting = (async () => {
      const results = await Promise.all(
        API_BASES.map((base) => probeBase(base, timeoutMs))
      );
      const ok = results.filter((r): r is ApiBaseSelection => !!r);
      ok.sort((a, b) => a.latencyMs - b.latencyMs);
      const selected = ok[0]?.baseUrl || API_BASES[0];

      await this.saveCache(selected);
      return selected;
    })();

    try {
      return await this.selecting;
    } finally {
      this.selecting = null;
    }
  }

  static async fetchApi(
    path: string,
    init?: RequestInit,
    options?: { timeoutMs?: number }
  ): Promise<Response> {
    if (/^https?:\/\//i.test(path)) {
      return fetch(path, init);
    }

    const base = await this.getApiBaseUrl();
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
    } catch (error) {
      console.warn('API request failed, retrying with fallback base:', error);
    }

    const fallback = await this.getApiBaseUrl({ forceRefresh: true, timeoutMs: options?.timeoutMs });
    const fallbackUrl = `${fallback}${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(fallbackUrl, init);
  }

  private static async getCachedBase(): Promise<string | null> {
    if (this.memoryBase && Date.now() - this.memoryTs < CACHE_TTL_MS) {
      return this.memoryBase;
    }

    try {
      const [base, tsStr] = await AsyncStorage.multiGet([CACHE_KEY, CACHE_TS_KEY]);
      const cachedBase = base?.[1] || null;
      const cachedTs = tsStr?.[1] ? parseInt(tsStr[1], 10) : 0;

      if (
        cachedBase &&
        API_BASES.includes(cachedBase) &&
        Date.now() - cachedTs < CACHE_TTL_MS
      ) {
        this.memoryBase = cachedBase;
        this.memoryTs = cachedTs;
        return cachedBase;
      }
    } catch (error) {
      console.warn('Failed to read API base cache:', error);
    }

    return null;
  }

  private static async saveCache(baseUrl: string): Promise<void> {
    this.memoryBase = baseUrl;
    this.memoryTs = Date.now();
    try {
      await AsyncStorage.multiSet([
        [CACHE_KEY, baseUrl],
        [CACHE_TS_KEY, String(this.memoryTs)],
      ]);
    } catch (error) {
      console.warn('Failed to save API base cache:', error);
    }
  }
}

export default ApiBaseService;
