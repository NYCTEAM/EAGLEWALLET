/**
 * Eagle Wallet - Price Service
 * Fetch token prices from GeckoTerminal API (Free)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';

// Token address mapping for price lookup
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  // BSC (56)
  56: {
    'BNB': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // Wrapped BNB
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    'ETH': '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    'BTCB': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    'USD1': '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
    'USDS': '0xce24439f2d9c6a2289f741120fe202248b666666',
    'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    'DAI': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
  },
};

// Network names for GeckoTerminal
const NETWORK_NAMES: Record<number, string> = {
  56: 'bsc',
};

interface PriceData {
  [tokenAddress: string]: string;
}

interface CachedPriceEntry {
  price: number;
  timestamp: number;
  change24h?: number;
  imageUrl?: string;
}

const PRICE_CACHE_STORAGE_KEY = 'EAGLE_PRICE_CACHE_V1';

const STABLE_TOKEN_PRICES_BY_CHAIN: Record<number, Record<string, number>> = {
  56: {
    '0x55d398326f99059ff775485246999027b3197955': 1, // USDT
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 1, // USDC
    '0xe9e7cea3dedca5984780bafc599bd69add087d56': 1, // BUSD
    '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3': 1, // DAI
    '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d': 1, // USD1
    '0xce24439f2d9c6a2289f741120fe202248b666666': 1, // USDS
  },
};

class PriceService {
  private priceCache: Map<string, CachedPriceEntry> = new Map();
  private cacheExpiry: number = 60 * 1000; // 1 minute
  private cacheLoaded = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  private normalizeAddress(address: string): string {
    return String(address || '').toLowerCase();
  }

  private cacheKey(chainId: number, tokenAddress: string): string {
    return `${chainId}-${this.normalizeAddress(tokenAddress)}`;
  }

  private async ensureCacheLoaded(): Promise<void> {
    if (this.cacheLoaded) return;
    this.cacheLoaded = true;
    try {
      const raw = await AsyncStorage.getItem(PRICE_CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, CachedPriceEntry>;
      Object.entries(parsed || {}).forEach(([key, value]) => {
        if (!value || typeof value.price !== 'number' || typeof value.timestamp !== 'number') return;
        this.priceCache.set(key, value);
      });
    } catch (error) {
      console.warn('Failed to load cached prices:', error);
    }
  }

  private schedulePersistCache(): void {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(async () => {
      this.persistTimer = null;
      try {
        const payload: Record<string, CachedPriceEntry> = {};
        this.priceCache.forEach((value, key) => {
          payload[key] = value;
        });
        await AsyncStorage.setItem(PRICE_CACHE_STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn('Failed to persist price cache:', error);
      }
    }, 250);
  }

  private setCacheEntry(
    chainId: number,
    tokenAddress: string,
    price: number,
    change24h?: number,
    imageUrl?: string
  ): void {
    const key = this.cacheKey(chainId, tokenAddress);
    const existing = this.priceCache.get(key);
    this.priceCache.set(key, {
      price,
      timestamp: Date.now(),
      change24h: typeof change24h === 'number' ? change24h : existing?.change24h || 0,
      imageUrl: imageUrl || existing?.imageUrl,
    });
    this.schedulePersistCache();
  }

  async getCachedTokenPricesWithChange(
    tokenAddresses: string[],
    chainId: number,
    maxAgeMs: number = 6 * 60 * 60 * 1000
  ): Promise<Record<string, { price: number; change24h: number; imageUrl?: string }>> {
    await this.ensureCacheLoaded();

    const result: Record<string, { price: number; change24h: number; imageUrl?: string }> = {};
    const now = Date.now();
    const wrappedNative = chainId === 56 ? '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' : '';
    const stablePrices = STABLE_TOKEN_PRICES_BY_CHAIN[chainId] || {};

    tokenAddresses.forEach((rawAddress) => {
      const address =
        rawAddress === 'native' && wrappedNative ? wrappedNative : this.normalizeAddress(rawAddress);
      if (!address) return;

      const entry = this.priceCache.get(this.cacheKey(chainId, address));
      if (entry && now - entry.timestamp <= maxAgeMs) {
        result[address] = {
          price: entry.price,
          change24h: entry.change24h || 0,
          imageUrl: entry.imageUrl,
        };
      } else if (stablePrices[address] !== undefined) {
        result[address] = { price: stablePrices[address], change24h: 0 };
      }

      if (rawAddress === 'native' && result[address]) {
        result.native = result[address];
      }
    });

    return result;
  }

  /**
   * Get token price in USD from GeckoTerminal
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<number> {
    try {
      await this.ensureCacheLoaded();
      const cacheKey = this.cacheKey(chainId, tokenAddress);
      const cached = this.priceCache.get(cacheKey);
      
      // Return cached price if not expired
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.price;
      }

      const network = NETWORK_NAMES[chainId];
      if (!network) {
        console.warn(`Network ${chainId} not supported for price lookup`);
        return 0;
      }

      const url = `${GECKOTERMINAL_API}/simple/networks/${network}/token_price/${tokenAddress}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Price API error: ${response.status}`);
        return 0;
      }

      const data = await response.json();
      const priceStr = data?.data?.attributes?.token_prices?.[tokenAddress.toLowerCase()];
      
      if (!priceStr) {
        console.warn(`No price data for ${tokenAddress}`);
        return 0;
      }

      const price = parseFloat(priceStr);
      this.setCacheEntry(chainId, tokenAddress, price, cached?.change24h, cached?.imageUrl);

      return price;
    } catch (error) {
      console.error('Get token price error:', error);
      return 0;
    }
  }

  /**
   * Get multiple token prices in one call
   */
  async getMultipleTokenPrices(
    tokenAddresses: string[],
    chainId: number
  ): Promise<Record<string, number>> {
    try {
      await this.ensureCacheLoaded();
      const network = NETWORK_NAMES[chainId];
      if (!network) {
        return {};
      }

      // Map 'native' to wrapped token address and filter out empty addresses
      const processedAddresses = tokenAddresses.map(addr => {
        if (addr === 'native') {
          // Return Wrapped Token address for native currency
          if (chainId === 56) return '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB
        }
        return addr;
      }).filter(Boolean);

      // GeckoTerminal supports comma-separated addresses
      const addressList = processedAddresses.join(',');
      const url = `${GECKOTERMINAL_API}/simple/networks/${network}/token_price/${addressList}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Price API error: ${response.status}`);
        return {};
      }

      const data = await response.json();
      const prices: Record<string, number> = {};
      const priceData: PriceData = data?.data?.attributes?.token_prices || {};

      // Parse prices
      for (const [address, priceStr] of Object.entries(priceData)) {
        const price = parseFloat(priceStr);
        const normalizedAddress = this.normalizeAddress(address);
        prices[normalizedAddress] = price;
        
        // If this address corresponds to a wrapped token, also cache it for 'native'
        if (chainId === 56 && normalizedAddress === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
          prices['native'] = price;
        }

        this.setCacheEntry(chainId, normalizedAddress, price);
      }

      return prices;
    } catch (error) {
      console.error('Get multiple token prices error:', error);
      return {};
    }
  }

  /**
   * Get token prices and 24h change in one call
   */
  async getTokenPricesWithChange(
    tokenAddresses: string[],
    chainId: number
  ): Promise<Record<string, { price: number; change24h: number; imageUrl?: string }>> {
    try {
      await this.ensureCacheLoaded();
      const network = NETWORK_NAMES[chainId];
      if (!network) {
        return {};
      }

      // Map 'native' to wrapped token address and filter out empty addresses
      const processedAddresses = tokenAddresses.map(addr => {
        if (addr === 'native') {
          // Return Wrapped Token address for native currency
          if (chainId === 56) return '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB
        }
        return addr;
      }).filter(Boolean);

      // GeckoTerminal multi-token endpoint
      const addressList = processedAddresses.join(',');
      const url = `${GECKOTERMINAL_API}/networks/${network}/tokens/multi/${addressList}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Price API error: ${response.status}`);
        return {};
      }

      const data = await response.json();
      const results: Record<string, { price: number; change24h: number; imageUrl?: string }> = {};
      const tokensData = data?.data || [];

      for (const tokenData of tokensData) {
        const attrs = tokenData.attributes;
        const address = this.normalizeAddress(attrs.address);
        const price = parseFloat(attrs.price_usd || '0');
        const change24h = parseFloat(attrs.price_change_percentage_24h || '0');
        const imageUrl = attrs.image_url;

        results[address] = { price, change24h, imageUrl };

        // Handle wrapped token mapping for native
        if (chainId === 56 && address === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
          results['native'] = { price, change24h, imageUrl };
        }

        this.setCacheEntry(chainId, address, price, change24h, imageUrl);
      }

      return results;
    } catch (error) {
      console.error('Get token prices with change error:', error);
      return {};
    }
  }

  /**
   * Get token price by symbol (convenience method)
   */
  async getTokenPriceBySymbol(symbol: string, chainId: number): Promise<number> {
    const address = TOKEN_ADDRESSES[chainId]?.[symbol];
    if (!address) {
      console.warn(`No address mapping for ${symbol} on chain ${chainId}`);
      return 0;
    }

    return await this.getTokenPrice(address, chainId);
  }

  /**
   * Calculate total portfolio value in USD
   */
  async calculateTotalValue(
    tokens: Array<{ address: string; balance: string; decimals: number }>,
    chainId: number
  ): Promise<number> {
    try {
      // Get all token addresses
      const addresses = tokens.map(t => t.address === 'native' 
        ? TOKEN_ADDRESSES[chainId]?.['BNB']
        : t.address
      ).filter(Boolean);

      // Fetch all prices at once
      const prices = await this.getMultipleTokenPrices(addresses, chainId);

      // Calculate total value
      let totalValue = 0;
      for (const token of tokens) {
        const address = token.address === 'native'
          ? TOKEN_ADDRESSES[chainId]?.['BNB']
          : token.address;

        if (!address) continue;

        const price = prices[address.toLowerCase()] || 0;
        const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
        const value = balance * price;
        
        totalValue += value;
      }

      return totalValue;
    } catch (error) {
      console.error('Calculate total value error:', error);
      return 0;
    }
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear();
    AsyncStorage.removeItem(PRICE_CACHE_STORAGE_KEY).catch(() => undefined);
  }
}

export default new PriceService();
