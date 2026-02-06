/**
 * Eagle Wallet - Token Service
 * Fetch user's token balances from blockchain
 */

import { ethers } from 'ethers';
import WalletService from './WalletService';

// ERC20 ABI for balanceOf and token info
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Common tokens on BSC
const COMMON_TOKENS_BSC = [
  {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    icon: '₮',
    color: '#26A17B',
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
    icon: '$',
    color: '#2775CA',
  },
  {
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    symbol: 'BUSD',
    name: 'Binance USD',
    decimals: 18,
    icon: '$',
    color: '#F0B90B',
  },
  {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: 'Ξ',
    color: '#627EEA',
  },
  {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    name: 'Bitcoin BEP2',
    decimals: 18,
    icon: '₿',
    color: '#F7931A',
  },
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
   * Get user's token balances
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

      // Get ERC20 token balances (only for BSC for now)
      if (chainId === 56) {
        for (const tokenInfo of COMMON_TOKENS_BSC) {
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
                value: '0.00', // TODO: Get price from API
                icon: tokenInfo.icon,
                color: tokenInfo.color,
              });
            }
          } catch (error) {
            console.error(`Error fetching ${tokenInfo.symbol}:`, error);
          }
        }
      }

      return tokens;
    } catch (error) {
      console.error('Get user tokens error:', error);
      return [];
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
