/**
 * Eagle Wallet - Gas Service
 * Manage gas prices and estimates
 */

import { ethers } from 'ethers';

export interface GasSettings {
  gasPrice?: string;           // Legacy (Wei)
  maxFeePerGas?: string;       // EIP-1559 (Wei)
  maxPriorityFeePerGas?: string; // EIP-1559 (Wei)
  gasLimit: string;
}

export interface GasOption {
  name: 'slow' | 'standard' | 'fast';
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedTime: string; // e.g., "~30 sec", "~15 sec", "~5 sec"
}

class GasService {
  /**
   * Get current gas price
   */
  async getGasPrice(provider: ethers.Provider): Promise<string> {
    try {
      const feeData = await provider.getFeeData();
      return feeData.gasPrice?.toString() || '0';
    } catch (error) {
      console.error('Error getting gas price:', error);
      return '5000000000'; // 5 Gwei default
    }
  }

  /**
   * Get EIP-1559 fee data
   */
  async getEIP1559Fees(provider: ethers.Provider): Promise<{
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }> {
    try {
      const feeData = await provider.getFeeData();
      return {
        maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
      };
    } catch (error) {
      console.error('Error getting EIP-1559 fees:', error);
      return {
        maxFeePerGas: '5000000000',
        maxPriorityFeePerGas: '1500000000',
      };
    }
  }

  /**
   * Get gas options (slow, standard, fast)
   */
  async getGasOptions(provider: ethers.Provider, chainId: number): Promise<GasOption[]> {
    try {
      const baseGasPrice = await this.getGasPrice(provider);
      const baseGwei = parseFloat(ethers.formatUnits(baseGasPrice, 'gwei'));

      // Check if chain supports EIP-1559
      const supportsEIP1559 = await this.supportsEIP1559(chainId);

      if (supportsEIP1559) {
        const { maxFeePerGas, maxPriorityFeePerGas } = await this.getEIP1559Fees(provider);
        const baseFee = parseFloat(ethers.formatUnits(maxFeePerGas, 'gwei'));
        const priorityFee = parseFloat(ethers.formatUnits(maxPriorityFeePerGas, 'gwei'));

        return [
          {
            name: 'slow',
            gasPrice: ethers.parseUnits((baseFee * 0.9).toFixed(9), 'gwei').toString(),
            maxFeePerGas: ethers.parseUnits((baseFee * 0.9).toFixed(9), 'gwei').toString(),
            maxPriorityFeePerGas: ethers.parseUnits((priorityFee * 0.9).toFixed(9), 'gwei').toString(),
            estimatedTime: '~30 sec',
          },
          {
            name: 'standard',
            gasPrice: baseGasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            estimatedTime: '~15 sec',
          },
          {
            name: 'fast',
            gasPrice: ethers.parseUnits((baseFee * 1.2).toFixed(9), 'gwei').toString(),
            maxFeePerGas: ethers.parseUnits((baseFee * 1.2).toFixed(9), 'gwei').toString(),
            maxPriorityFeePerGas: ethers.parseUnits((priorityFee * 1.2).toFixed(9), 'gwei').toString(),
            estimatedTime: '~5 sec',
          },
        ];
      } else {
        // Legacy gas pricing
        return [
          {
            name: 'slow',
            gasPrice: ethers.parseUnits((baseGwei * 0.9).toFixed(9), 'gwei').toString(),
            estimatedTime: '~30 sec',
          },
          {
            name: 'standard',
            gasPrice: baseGasPrice,
            estimatedTime: '~15 sec',
          },
          {
            name: 'fast',
            gasPrice: ethers.parseUnits((baseGwei * 1.2).toFixed(9), 'gwei').toString(),
            estimatedTime: '~5 sec',
          },
        ];
      }
    } catch (error) {
      console.error('Error getting gas options:', error);
      // Return default options
      return [
        { name: 'slow', gasPrice: '4000000000', estimatedTime: '~30 sec' },
        { name: 'standard', gasPrice: '5000000000', estimatedTime: '~15 sec' },
        { name: 'fast', gasPrice: '6000000000', estimatedTime: '~5 sec' },
      ];
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    tx: ethers.TransactionRequest,
    provider: ethers.Provider
  ): Promise<string> {
    try {
      const estimate = await provider.estimateGas(tx);
      // Add 10% buffer
      const buffered = estimate * BigInt(110) / BigInt(100);
      return buffered.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '21000'; // Default gas limit for simple transfer
    }
  }

  /**
   * Calculate transaction fee
   */
  calculateFee(gasLimit: string, gasPrice: string): string {
    try {
      const fee = BigInt(gasLimit) * BigInt(gasPrice);
      return fee.toString();
    } catch (error) {
      return '0';
    }
  }

  /**
   * Format gas price to Gwei
   */
  formatGasPrice(gasPrice: string): string {
    try {
      return ethers.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      return '0';
    }
  }

  /**
   * Parse gas price from Gwei
   */
  parseGasPrice(gwei: string): string {
    try {
      return ethers.parseUnits(gwei, 'gwei').toString();
    } catch (error) {
      return '0';
    }
  }

  /**
   * Check if chain supports EIP-1559
   */
  private async supportsEIP1559(chainId: number): Promise<boolean> {
    // BSC doesn't support EIP-1559 yet
    // Ethereum mainnet and some L2s support it
    const eip1559Chains = [1, 5, 137, 10, 42161]; // Ethereum, Goerli, Polygon, Optimism, Arbitrum
    return eip1559Chains.includes(chainId);
  }

  /**
   * Get recommended gas limit for token transfer
   */
  getRecommendedGasLimit(tokenType: 'native' | 'ERC20' | 'ERC721' | 'ERC1155'): string {
    switch (tokenType) {
      case 'native':
        return '21000';
      case 'ERC20':
        return '65000';
      case 'ERC721':
        return '85000';
      case 'ERC1155':
        return '100000';
      default:
        return '21000';
    }
  }
}

export default new GasService();
