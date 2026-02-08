/**
 * Eagle Wallet - Price Service
 * Fetch token prices from GeckoTerminal API (Free)
 */

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
  // X Layer (196)
  196: {
    'OKB': '0xe538905cf8410324e03a5a23c1c177a474d59b2b', // Using WOKB as proxy for OKB price
    'WOKB': '0xe538905cf8410324e03a5a23c1c177a474d59b2b',
    'USDT': '0x1e4a5963abfd975d8c9021ce480b42188849d41d',
    'USDT0': '0x779ded0c9e1022225f8e0630b35a9b54be713736',
    'WETH': '0x5A77f1443D16ee5761d310e38b62f77f726bC71c',
    'EAGLE': '0x5a746ee9933627ed79822d35a3fe812eddd5ba37',
  },
};

// Network names for GeckoTerminal
const NETWORK_NAMES: Record<number, string> = {
  56: 'bsc',
  196: 'xlayer',
};

interface PriceData {
  [tokenAddress: string]: string;
}

class PriceService {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private cacheExpiry: number = 60 * 1000; // 1 minute

  /**
   * Get token price in USD from GeckoTerminal
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<number> {
    try {
      const cacheKey = `${chainId}-${tokenAddress.toLowerCase()}`;
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
      
      // Cache the price
      this.priceCache.set(cacheKey, {
        price,
        timestamp: Date.now(),
      });

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
      const network = NETWORK_NAMES[chainId];
      if (!network) {
        return {};
      }

      // Map 'native' to wrapped token address and filter out empty addresses
      const processedAddresses = tokenAddresses.map(addr => {
        if (addr === 'native') {
          // Return Wrapped Token address for native currency
          if (chainId === 56) return '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB
          if (chainId === 196) return '0xe538905cf8410324e03A5A23C1c177a474D59b2b'; // WOKB
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
        prices[address.toLowerCase()] = price;
        
        // If this address corresponds to a wrapped token, also cache it for 'native'
        if (chainId === 56 && address.toLowerCase() === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
          prices['native'] = price;
        }
        if (chainId === 196 && address.toLowerCase() === '0xe538905cf8410324e03a5a23c1c177a474d59b2b') {
          prices['native'] = price;
        }

        // Cache individual prices
        const cacheKey = `${chainId}-${address.toLowerCase()}`;
        this.priceCache.set(cacheKey, {
          price,
          timestamp: Date.now(),
        });
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
      const network = NETWORK_NAMES[chainId];
      if (!network) {
        return {};
      }

      // Map 'native' to wrapped token address and filter out empty addresses
      const processedAddresses = tokenAddresses.map(addr => {
        if (addr === 'native') {
          // Return Wrapped Token address for native currency
          if (chainId === 56) return '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB
          if (chainId === 196) return '0xe538905cf8410324e03A5A23C1c177a474D59b2b'; // WOKB
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
        const address = attrs.address.toLowerCase();
        const price = parseFloat(attrs.price_usd || '0');
        const change24h = parseFloat(attrs.price_change_percentage_24h || '0');
        const imageUrl = attrs.image_url;

        results[address] = { price, change24h, imageUrl };

        // Handle wrapped token mapping for native
        if (chainId === 56 && address === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
          results['native'] = { price, change24h, imageUrl };
        }
        if (chainId === 196 && address === '0xe538905cf8410324e03a5a23c1c177a474d59b2b') {
          results['native'] = { price, change24h, imageUrl };
        }

        // Update cache (only price for now to keep compatibility)
        const cacheKey = `${chainId}-${address}`;
        this.priceCache.set(cacheKey, {
          price,
          timestamp: Date.now(),
        });
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
        ? TOKEN_ADDRESSES[chainId]?.['BNB'] || TOKEN_ADDRESSES[chainId]?.['OKB']
        : t.address
      ).filter(Boolean);

      // Fetch all prices at once
      const prices = await this.getMultipleTokenPrices(addresses, chainId);

      // Calculate total value
      let totalValue = 0;
      for (const token of tokens) {
        const address = token.address === 'native'
          ? TOKEN_ADDRESSES[chainId]?.['BNB'] || TOKEN_ADDRESSES[chainId]?.['OKB']
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
  }
}

export default new PriceService();
