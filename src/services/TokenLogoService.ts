/**
 * Eagle Wallet - Token Logo Service
 * Load token logos from assets
 */

import { Image } from 'react-native';

// Token logo mapping
const TOKEN_LOGOS: Record<string, any> = {
  // Mainstream tokens
  'eagle': require('../assets/tokens/eagle.png'),
  'bnb': require('../assets/tokens/bnb.png'),
  'usdt': require('../assets/tokens/usdt.png'),
  'usdc': require('../assets/tokens/usdc.png'),
  'busd': require('../assets/tokens/busd.png'),
  'dai': require('../assets/tokens/dai.png'),
  'eth': require('../assets/tokens/eth.png'),
  'weth': require('../assets/tokens/weth.png'),
  'btcb': require('../assets/tokens/btcb.png'),
  'wbnb': require('../assets/tokens/wbnb.png'),
  'cake': require('../assets/tokens/cake.png'),
  'okb': require('../assets/tokens/okb.png'),
  'wokb': require('../assets/tokens/wokb.png'),
  'usd1': require('../assets/tokens/usd1.png'),
  'usds': require('../assets/tokens/usds.png'),
  'usdt0': require('../assets/tokens/usdt0.png'),
};

class TokenLogoService {
  /**
   * Get token logo by symbol
   */
  getTokenLogo(symbol: string): any | null {
    const key = symbol.toLowerCase();
    return TOKEN_LOGOS[key] || null;
  }

  /**
   * Check if token has logo
   */
  hasLogo(symbol: string): boolean {
    const key = symbol.toLowerCase();
    return !!TOKEN_LOGOS[key];
  }

  /**
   * Preload all token logos
   */
  async preloadLogos(): Promise<void> {
    const promises = Object.values(TOKEN_LOGOS).map(logo => {
      return Image.prefetch(Image.resolveAssetSource(logo).uri);
    });
    
    try {
      await Promise.all(promises);
      console.log('Token logos preloaded');
    } catch (error) {
      console.error('Error preloading logos:', error);
    }
  }

  /**
   * Get all available logos
   */
  getAllLogos(): Record<string, any> {
    return TOKEN_LOGOS;
  }
}

export default new TokenLogoService();
