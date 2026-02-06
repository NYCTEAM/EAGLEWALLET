/**
 * Eagle Wallet - Token Logo Service
 * Load token logos from assets
 */

import { Image } from 'react-native';

// Token logo mapping
const TOKEN_LOGOS: Record<string, any> = {
  // Mainstream tokens
  'eagle': require('../../android/app/src/main/assets/tokens/eagle.png'),
  'bnb': require('../../android/app/src/main/assets/tokens/bnb.png'),
  'usdt': require('../../android/app/src/main/assets/tokens/usdt.png'),
  'usdc': require('../../android/app/src/main/assets/tokens/usdc.png'),
  'busd': require('../../android/app/src/main/assets/tokens/busd.png'),
  'dai': require('../../android/app/src/main/assets/tokens/dai.png'),
  'eth': require('../../android/app/src/main/assets/tokens/eth.png'),
  'weth': require('../../android/app/src/main/assets/tokens/weth.png'),
  'btcb': require('../../android/app/src/main/assets/tokens/btcb.png'),
  'wbnb': require('../../android/app/src/main/assets/tokens/wbnb.png'),
  'cake': require('../../android/app/src/main/assets/tokens/cake.png'),
  'okb': require('../../android/app/src/main/assets/tokens/okb.png'),
  'wokb': require('../../android/app/src/main/assets/tokens/wokb.png'),
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
