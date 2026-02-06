/**
 * Eagle Wallet - Custom Token Service
 * Add and manage custom ERC20/721/1155 tokens
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_TOKENS_KEY = 'EAGLE_CUSTOM_TOKENS';

// ERC20 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

// ERC721 ABI
const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function supportsInterface(bytes4) view returns (bool)',
];

// ERC1155 ABI
const ERC1155_ABI = [
  'function supportsInterface(bytes4) view returns (bool)',
  'function uri(uint256) view returns (string)',
];

export interface CustomToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  chainId: number;
  logo?: string;
  addedAt: number;
}

class CustomTokenService {
  /**
   * Detect token type
   */
  async detectTokenType(address: string, provider: ethers.Provider): Promise<string> {
    try {
      // ERC165 interface IDs
      const ERC721_INTERFACE_ID = '0x80ac58cd';
      const ERC1155_INTERFACE_ID = '0xd9b67a26';

      // Try ERC721
      try {
        const erc721 = new ethers.Contract(address, ERC721_ABI, provider);
        const isERC721 = await erc721.supportsInterface(ERC721_INTERFACE_ID);
        if (isERC721) return 'ERC721';
      } catch (e) {
        // Not ERC721
      }

      // Try ERC1155
      try {
        const erc1155 = new ethers.Contract(address, ERC1155_ABI, provider);
        const isERC1155 = await erc1155.supportsInterface(ERC1155_INTERFACE_ID);
        if (isERC1155) return 'ERC1155';
      } catch (e) {
        // Not ERC1155
      }

      // Default to ERC20
      return 'ERC20';
    } catch (error) {
      return 'ERC20';
    }
  }

  /**
   * Get token info from contract
   */
  async getTokenInfo(
    contractAddress: string,
    chainId: number,
    provider: ethers.Provider
  ): Promise<CustomToken> {
    try {
      // Detect token type
      const tokenType = await this.detectTokenType(contractAddress, provider);

      if (tokenType === 'ERC20') {
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
        ]);

        return {
          address: contractAddress,
          symbol,
          name,
          decimals: Number(decimals),
          type: 'ERC20',
          chainId,
          addedAt: Date.now(),
        };
      } else if (tokenType === 'ERC721') {
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
        const [name, symbol] = await Promise.all([
          contract.name(),
          contract.symbol(),
        ]);

        return {
          address: contractAddress,
          symbol,
          name,
          decimals: 0,
          type: 'ERC721',
          chainId,
          addedAt: Date.now(),
        };
      } else {
        // ERC1155
        return {
          address: contractAddress,
          symbol: 'ERC1155',
          name: 'ERC1155 Collection',
          decimals: 0,
          type: 'ERC1155',
          chainId,
          addedAt: Date.now(),
        };
      }
    } catch (error) {
      console.error('Error getting token info:', error);
      throw new Error('Failed to fetch token information. Please check the contract address.');
    }
  }

  /**
   * Add custom token
   */
  async addCustomToken(token: CustomToken): Promise<void> {
    try {
      const tokens = await this.getCustomTokens();
      
      // Check if token already exists
      const exists = tokens.some(
        t => t.address.toLowerCase() === token.address.toLowerCase() && t.chainId === token.chainId
      );
      
      if (exists) {
        throw new Error('Token already added');
      }

      tokens.push(token);
      await AsyncStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error adding custom token:', error);
      throw error;
    }
  }

  /**
   * Get all custom tokens
   */
  async getCustomTokens(): Promise<CustomToken[]> {
    try {
      const tokensJson = await AsyncStorage.getItem(CUSTOM_TOKENS_KEY);
      if (!tokensJson) {
        return [];
      }
      return JSON.parse(tokensJson);
    } catch (error) {
      console.error('Error getting custom tokens:', error);
      return [];
    }
  }

  /**
   * Get custom tokens for specific chain
   */
  async getCustomTokensByChain(chainId: number): Promise<CustomToken[]> {
    const tokens = await this.getCustomTokens();
    return tokens.filter(t => t.chainId === chainId);
  }

  /**
   * Remove custom token
   */
  async removeCustomToken(address: string, chainId: number): Promise<void> {
    try {
      const tokens = await this.getCustomTokens();
      const filtered = tokens.filter(
        t => !(t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId)
      );
      await AsyncStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing custom token:', error);
      throw error;
    }
  }

  /**
   * Check if token is custom
   */
  async isCustomToken(address: string, chainId: number): Promise<boolean> {
    const tokens = await this.getCustomTokens();
    return tokens.some(
      t => t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId
    );
  }

  /**
   * Update token logo
   */
  async updateTokenLogo(address: string, chainId: number, logo: string): Promise<void> {
    try {
      const tokens = await this.getCustomTokens();
      const token = tokens.find(
        t => t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId
      );
      
      if (token) {
        token.logo = logo;
        await AsyncStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens));
      }
    } catch (error) {
      console.error('Error updating token logo:', error);
      throw error;
    }
  }
}

export default new CustomTokenService();
