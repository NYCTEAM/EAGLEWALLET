/**
 * Eagle Wallet - Swap Service
 * Token swap with aggregator contract integration
 */

import { ethers } from 'ethers';
import WalletService from './WalletService';

// Aggregator Contract ABI
const AGGREGATOR_ABI = [
  'function swap(address fromToken, address toToken, uint256 amountIn, uint256 minAmountOut, address[] calldata path, uint8 dexId) external payable returns (uint256)',
  'function getAmountOut(uint256 amountIn, address fromToken, address toToken, uint8 dexId) external view returns (uint256)',
  'function getBestRate(uint256 amountIn, address fromToken, address toToken) external view returns (uint256 amountOut, uint8 dexId, address[] memory path)',
  'function supportedDEXs() external view returns (string[] memory)',
];

// ERC20 ABI for approval
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string; // With slippage
  provider: string;
  dexId: number;
  path: string[];
  priceImpact: string;
  gasEstimate: string;
  exchangeRate: string;
}

export interface SwapRoute {
  dexName: string;
  dexId: number;
  amountOut: string;
  path: string[];
  gasEstimate: string;
}

// DEX IDs
export enum DEX {
  PANCAKESWAP = 0,
  UNISWAP = 1,
  SUSHISWAP = 2,
  APESWAP = 3,
  BISWAP = 4,
  BABYSWAP = 5,
}

// Aggregator contract addresses by chain
const AGGREGATOR_CONTRACTS: Record<number, string> = {
  56: '0x...', // BSC aggregator contract address
  196: '0x...', // XLAYER aggregator contract address
};

class SwapService {
  /**
   * Get aggregator contract
   */
  private async getAggregatorContract(chainId: number): Promise<ethers.Contract> {
    const contractAddress = AGGREGATOR_CONTRACTS[chainId];
    if (!contractAddress) {
      throw new Error('Aggregator not supported on this chain');
    }

    const provider = await WalletService.getProvider();
    return new ethers.Contract(contractAddress, AGGREGATOR_ABI, provider);
  }

  /**
   * Get best swap route
   */
  async getBestRoute(
    fromToken: string,
    toToken: string,
    amountIn: string,
    chainId: number
  ): Promise<SwapRoute> {
    try {
      const contract = await this.getAggregatorContract(chainId);
      
      const [amountOut, dexId, path] = await contract.getBestRate(
        amountIn,
        fromToken,
        toToken
      );

      const dexNames = ['PancakeSwap', 'Uniswap', 'SushiSwap', 'ApeSwap', 'BiSwap', 'BabySwap'];

      return {
        dexName: dexNames[dexId] || 'Unknown',
        dexId: Number(dexId),
        amountOut: amountOut.toString(),
        path: path,
        gasEstimate: '200000', // Estimate
      };
    } catch (error) {
      console.error('Error getting best route:', error);
      throw error;
    }
  }

  /**
   * Get swap quote with multiple routes
   */
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amountIn: string,
    chainId: number,
    slippage: number = 0.5 // 0.5% default
  ): Promise<SwapQuote> {
    try {
      const route = await this.getBestRoute(fromToken, toToken, amountIn, chainId);
      
      // Calculate minimum amount out with slippage
      const amountOut = BigInt(route.amountOut);
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      const minAmountOut = (amountOut * slippageMultiplier) / BigInt(10000);

      // Calculate price impact
      const amountInBig = BigInt(amountIn);
      const priceImpact = this.calculatePriceImpact(amountInBig, amountOut);

      // Calculate exchange rate
      const exchangeRate = this.calculateExchangeRate(amountInBig, amountOut);

      return {
        fromToken,
        toToken,
        fromAmount: amountIn,
        toAmount: route.amountOut,
        toAmountMin: minAmountOut.toString(),
        provider: route.dexName,
        dexId: route.dexId,
        path: route.path,
        priceImpact: priceImpact.toFixed(2),
        gasEstimate: route.gasEstimate,
        exchangeRate,
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  /**
   * Get quotes from all DEXs
   */
  async getAllQuotes(
    fromToken: string,
    toToken: string,
    amountIn: string,
    chainId: number
  ): Promise<SwapRoute[]> {
    try {
      const contract = await this.getAggregatorContract(chainId);
      const routes: SwapRoute[] = [];

      const dexNames = ['PancakeSwap', 'Uniswap', 'SushiSwap', 'ApeSwap', 'BiSwap', 'BabySwap'];

      // Get quotes from each DEX
      for (let dexId = 0; dexId < 6; dexId++) {
        try {
          const amountOut = await contract.getAmountOut(
            amountIn,
            fromToken,
            toToken,
            dexId
          );

          if (amountOut > 0) {
            routes.push({
              dexName: dexNames[dexId],
              dexId,
              amountOut: amountOut.toString(),
              path: [fromToken, toToken],
              gasEstimate: '200000',
            });
          }
        } catch (error) {
          // DEX might not support this pair
          continue;
        }
      }

      // Sort by amount out (best rate first)
      routes.sort((a, b) => {
        return BigInt(b.amountOut) > BigInt(a.amountOut) ? 1 : -1;
      });

      return routes;
    } catch (error) {
      console.error('Error getting all quotes:', error);
      return [];
    }
  }

  /**
   * Execute swap
   */
  async executeSwap(
    quote: SwapQuote,
    wallet: ethers.Wallet,
    chainId: number
  ): Promise<string> {
    try {
      const provider = await WalletService.getProvider();
      const connectedWallet = wallet.connect(provider);
      
      // Check if token needs approval
      if (quote.fromToken !== ethers.ZeroAddress) {
        await this.approveToken(
          quote.fromToken,
          AGGREGATOR_CONTRACTS[chainId],
          quote.fromAmount,
          connectedWallet
        );
      }

      // Get aggregator contract
      const contract = new ethers.Contract(
        AGGREGATOR_CONTRACTS[chainId],
        AGGREGATOR_ABI,
        connectedWallet
      );

      // Execute swap
      const value = quote.fromToken === ethers.ZeroAddress ? quote.fromAmount : '0';
      
      const tx = await contract.swap(
        quote.fromToken,
        quote.toToken,
        quote.fromAmount,
        quote.toAmountMin,
        quote.path,
        quote.dexId,
        { value }
      );

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  /**
   * Approve token for swap
   */
  private async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    wallet: ethers.Wallet
  ): Promise<void> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      
      // Check current allowance
      const allowance = await tokenContract.allowance(
        wallet.address,
        spenderAddress
      );

      // If allowance is sufficient, no need to approve
      if (BigInt(allowance.toString()) >= BigInt(amount)) {
        return;
      }

      // Approve max amount for better UX
      const maxAmount = ethers.MaxUint256;
      const tx = await tokenContract.approve(spenderAddress, maxAmount);
      await tx.wait();
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  /**
   * Calculate price impact
   */
  private calculatePriceImpact(amountIn: bigint, amountOut: bigint): number {
    try {
      // Simple price impact calculation
      // More accurate calculation would need pool reserves
      const expectedOut = amountIn; // 1:1 for simplicity
      const impact = ((expectedOut - amountOut) * BigInt(10000)) / expectedOut;
      return Number(impact) / 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate exchange rate
   */
  private calculateExchangeRate(amountIn: bigint, amountOut: bigint): string {
    try {
      if (amountIn === BigInt(0)) return '0';
      const rate = (amountOut * BigInt(1e18)) / amountIn;
      return ethers.formatUnits(rate, 18);
    } catch (error) {
      return '0';
    }
  }

  /**
   * Get supported tokens for swap
   */
  async getSupportedTokens(chainId: number): Promise<string[]> {
    // Return common tokens that support swap
    const tokens: Record<number, string[]> = {
      56: [
        ethers.ZeroAddress, // BNB
        '0x55d398326f99059fF775485246999027B3197955', // USDT
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
        '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ETH
        '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BTCB
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
        '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // CAKE
      ],
      196: [
        ethers.ZeroAddress, // OKB
        '0x1e4a5963abfd975d8c9021ce480b42188849d41d', // USDT
      ],
    };

    return tokens[chainId] || [];
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: string, decimals: number): string {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch (error) {
      return '0';
    }
  }

  /**
   * Parse amount from input
   */
  parseAmount(amount: string, decimals: number): string {
    try {
      return ethers.parseUnits(amount, decimals).toString();
    } catch (error) {
      return '0';
    }
  }
}

export default new SwapService();
