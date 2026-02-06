/**
 * Eagle Wallet - Token Service
 * Fetch user's token balances from blockchain
 */

import { ethers } from 'ethers';
import WalletService from './WalletService';
import PriceService from './PriceService';
import { getChainTokens, getTokenConfig } from '../config/tokenConfig';

// ERC20 ABI for balanceOf and token info
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  value: string; // USD value
  icon: string;
  color: string;
}

class TokenService {
  /**
   * Get user's token balances with USD values
   */
  async getUserTokens(chainId: number): Promise<Token[]> {
    try {
      const address = await WalletService.getAddress();
      if (!address) {
        return [];
      }

      const provider = await WalletService.getProvider();
      const tokens: Token[] = [];

      // Get native token balance (BNB/OKB)
      const nativeBalance = await provider.getBalance(address);
      const network = WalletService.getCurrentNetwork();
      
      tokens.push({
        address: 'native',
        symbol: network.symbol,
        name: network.name,
        decimals: 18,
        balance: nativeBalance.toString(),
        balanceFormatted: ethers.formatEther(nativeBalance),
        value: '0.00',
        icon: network.symbol.charAt(0),
        color: network.color,
      });

      // Get ERC20 token balances from predefined token list
      const chainTokens = getChainTokens(chainId);
      for (const tokenInfo of chainTokens) {
        try {
          const contract = new ethers.Contract(
            tokenInfo.address,
            ERC20_ABI,
            provider
          );

          const balance = await contract.balanceOf(address);
          
          // Only include tokens with balance > 0
          if (balance > 0n) {
            const balanceFormatted = ethers.formatUnits(balance, tokenInfo.decimals);
            
            tokens.push({
              address: tokenInfo.address,
              symbol: tokenInfo.symbol,
              name: tokenInfo.name,
              decimals: tokenInfo.decimals,
              balance: balance.toString(),
              balanceFormatted,
              value: '0.00',
              icon: tokenInfo.icon,
              color: tokenInfo.color,
            });
          }
        } catch (error) {
          console.error(`Error fetching ${tokenInfo.symbol}:`, error);
        }
      }

      // Fetch prices for all tokens
      await this.updateTokenPrices(tokens, chainId);

      return tokens;
    } catch (error) {
      console.error('Get user tokens error:', error);
      return [];
    }
  }

  /**
   * Update token prices and USD values
   */
  async updateTokenPrices(tokens: Token[], chainId: number): Promise<void> {
    try {
      // Collect all token addresses for batch price fetch
      const addresses = tokens.map(t => t.address);
      
      // Get prices from GeckoTerminal
      const prices = await PriceService.getMultipleTokenPrices(
        addresses.map(addr => 
          addr === 'native' 
            ? (chainId === 56 ? '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' : addr)
            : addr
        ),
        chainId
      );

      // Update each token's USD value
      for (const token of tokens) {
        const priceKey = token.address === 'native'
          ? (chainId === 56 ? '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' : token.address)
          : token.address.toLowerCase();
        
        const price = prices[priceKey] || 0;
        const balance = parseFloat(token.balanceFormatted);
        const usdValue = balance * price;
        
        token.value = usdValue.toFixed(2);
      }
    } catch (error) {
      console.error('Update token prices error:', error);
    }
  }

  /**
   * Get single token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    userAddress: string,
    provider: ethers.Provider
  ): Promise<string> {
    try {
      if (tokenAddress === 'native') {
        const balance = await provider.getBalance(userAddress);
        return ethers.formatEther(balance);
      }

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Get token balance error:', error);
      return '0';
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(
    tokenAddress: string,
    provider: ethers.Provider
  ): Promise<{ symbol: string; name: string; decimals: number } | null> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals(),
      ]);

      return { symbol, name, decimals };
    } catch (error) {
      console.error('Get token info error:', error);
      return null;
    }
  }

  /**
   * Add custom token
   */
  async addCustomToken(tokenAddress: string, chainId: number): Promise<Token | null> {
    try {
      const provider = await WalletService.getProvider();
      const userAddress = await WalletService.getAddress();
      
      if (!userAddress) {
        return null;
      }

      const tokenInfo = await this.getTokenInfo(tokenAddress, provider);
      if (!tokenInfo) {
        return null;
      }

      const balance = await this.getTokenBalance(tokenAddress, userAddress, provider);

      return {
        address: tokenAddress,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        balance: '0',
        balanceFormatted: balance,
        value: '0.00',
        icon: tokenInfo.symbol.charAt(0),
        color: '#999999',
      };
    } catch (error) {
      console.error('Add custom token error:', error);
      return null;
    }
  }
}

export default new TokenService();
