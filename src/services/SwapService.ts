/**
 * Eagle Wallet - Swap Service
 * Token swap with aggregator contract integration
 */

import { ethers } from 'ethers';
import WalletService from './WalletService';

// Factory ABI
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];

// Pair ABI
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

// Aggregator Contract ABI (Eagle Swap V11)
const AGGREGATOR_ABI = [
  // V2
  'function eagleSwapV2Router(address router, address[] calldata path, uint256 amountIn, uint256 minOut) external payable returns (uint256)',
  'function eagleSwapV2RouterSupportingFee(address router, address[] calldata path, uint256 amountIn, uint256 minOut) external payable',
  'function eagleSwapV2Direct(address router, address[] calldata path, uint256 amountIn, uint256 minOut) external payable returns (uint256 amountOut)',
  // V3
  'function eagleSwapV3Direct(address router, bytes calldata path, address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external payable returns (uint256 amountOut)',
  'function eagleSwapV3Router(address router, address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint256 minOut) external payable returns (uint256 amountOut)',
  'function eagleSwapV3RouterMultiHop(address router, bytes calldata path, address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external payable returns (uint256 amountOut)',
];

// Constants
const PANCAKESWAP_V2_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6076E6F1403C6';
const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';

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
  quoteType?: 'V2' | 'V3'; // Added for execution routing
  fees?: number; // Fee tier for V3
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
  56: '0xF78D10CbbEBfD569f818faC8BA9697C6EebEFF9E', // BSC aggregator contract address
  196: '0x...', // XLAYER aggregator contract address
};

export interface LiquidityResult {
  protocol: 'V2' | 'V3';
  address: string; // Pair address
  liquidityUSD: number;
  feeTier?: number; // Only for V3
  pairName: string;
}

// Subgraph URL
const SUBGRAPH_URL = 'https://dex.eagleswap.io/subgraphs/name/eagle-swap/pancakeswap';

export interface SwapRouteResult {
  quoteType: 'V2' | 'V3';
  amountOut: string;
  path: string[];
  fees: number;
  priceImpact: string;
}

class SwapService {
  /**
   * Helper: Query Subgraph
   */
  private async querySubgraph(query: string): Promise<any> {
    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Subgraph query error:', error);
      return null;
    }
  }

  /**
   * Calculate V2 Amount Out
   */
  private calculateV2AmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
    if (reserveIn === 0n || reserveOut === 0n) return 0n;
    const amountInWithFee = amountIn * 9975n; // 0.25% fee
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 10000n + amountInWithFee;
    return numerator / denominator;
  }

  /**
   * Calculate V3 Amount Out (Simplified)
   */
  private calculateV3AmountOut(amountIn: bigint, liquidity: bigint, feeTier: number): bigint {
    if (liquidity === 0n) return 0n;
    // Simplified estimation: Linear based on fee
    const feeMultiplier = 10000n - BigInt(feeTier);
    return (amountIn * feeMultiplier) / 10000n;
  }

  /**
   * Get Best Quote using Subgraph (Direct & Multi-hop)
   */
  async getBestQuote(tokenIn: string, tokenOut: string, amountInStr: string, decimalsIn: number, decimalsOut: number): Promise<SwapRouteResult | null> {
    const amountIn = ethers.parseUnits(amountInStr, decimalsIn);
    
    // Map native token to wrapped token for subgraph query
    const WBNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
    const WOKB = '0xe538905cf8410324e03a5a23c1c177a474d59b2b'; // Assuming WOKB address for XLAYER if needed, or update based on chain

    let queryTokenIn = tokenIn.toLowerCase();
    let queryTokenOut = tokenOut.toLowerCase();

    // Handle Native Token (Zero Address) -> Wrapped Token
    if (queryTokenIn === ethers.ZeroAddress.toLowerCase()) {
        // We assume BSC for now as per previous context, or we could pass chainId.
        // Given the hardcoded aggregator address is BSC, we use WBNB.
        queryTokenIn = WBNB.toLowerCase();
    }
    if (queryTokenOut === ethers.ZeroAddress.toLowerCase()) {
        queryTokenOut = WBNB.toLowerCase();
    }

    // 1. Check Direct Pools
    const directV2Query = `{
      pairs(where: {
        or: [
          { token0: "${queryTokenIn}", token1: "${queryTokenOut}" },
          { token0: "${queryTokenOut}", token1: "${queryTokenIn}" }
        ]
      }) {
        id, token0 { id, decimals }, token1 { id, decimals }, reserve0, reserve1
      }
    }`;
    
    const directV3Query = `{
      pools(orderBy: totalValueLockedUSD, orderDirection: desc, where: {
        or: [
          { token0: "${queryTokenIn}", token1: "${queryTokenOut}" },
          { token0: "${queryTokenOut}", token1: "${queryTokenIn}" }
        ]
      }) {
        id, token0 { id, decimals }, token1 { id, decimals }, liquidity, feeTier
      }
    }`;

    const [v2Data, v3Data] = await Promise.all([
      this.querySubgraph(directV2Query),
      this.querySubgraph(directV3Query)
    ]);

    let bestQuote: SwapRouteResult | null = null;
    let maxAmountOut = 0n;

    // Evaluate Direct V2
    if (v2Data?.pairs?.[0]) {
      const pair = v2Data.pairs[0];
      const isToken0In = pair.token0.id === queryTokenIn;
      const reserveIn = ethers.parseUnits(isToken0In ? pair.reserve0 : pair.reserve1, parseInt(isToken0In ? pair.token0.decimals : pair.token1.decimals));
      const reserveOut = ethers.parseUnits(isToken0In ? pair.reserve1 : pair.reserve0, parseInt(isToken0In ? pair.token1.decimals : pair.token0.decimals));
      
      // Calculate amount out
      const amountOut = this.calculateV2AmountOut(BigInt(amountIn.toString()), BigInt(reserveIn.toString()), BigInt(reserveOut.toString()));
      
      if (amountOut > maxAmountOut) {
        maxAmountOut = amountOut;
        bestQuote = {
          quoteType: 'V2',
          amountOut: ethers.formatUnits(amountOut, decimalsOut),
          path: [tokenIn, tokenOut], // Use original addresses for execution path (contract handles native)
          fees: 2500,
          priceImpact: '0.00' 
        };
      }
    }

    // Evaluate Direct V3
    if (v3Data?.pools) {
      for (const pool of v3Data.pools) {
        const fee = parseInt(pool.feeTier);
        const amountOut = this.calculateV3AmountOut(BigInt(amountIn.toString()), BigInt(pool.liquidity), fee);
        
        if (amountOut > maxAmountOut) {
          maxAmountOut = amountOut;
          bestQuote = {
            quoteType: 'V3',
            amountOut: ethers.formatUnits(amountOut, decimalsOut),
            path: [tokenIn, tokenOut], 
            fees: fee,
            priceImpact: '0.00'
          };
        }
      }
    }

    if (bestQuote) return bestQuote;

    // 2. Multi-hop via WBNB (Intermediate)
    // If input/output is already WBNB/Native, we don't need to hop via WBNB again.
    const isNativeOrWrapped = (addr: string) => addr === WBNB_ADDRESS.toLowerCase() || addr === ethers.ZeroAddress.toLowerCase();
    
    // Check if Direct V2 failed (fallback to RPC)
    if (!bestQuote) {
        try {
            const rpcQuote = await this.getV2QuoteRPC(queryTokenIn, queryTokenOut, amountIn, decimalsOut);
            if (rpcQuote) {
                 bestQuote = {
                    quoteType: 'V2',
                    amountOut: ethers.formatUnits(rpcQuote, decimalsOut),
                    path: [tokenIn, tokenOut],
                    fees: 2500,
                    priceImpact: '0.00'
                };
            }
        } catch (err) {
            console.warn('RPC Quote failed:', err);
        }
    }

    if (bestQuote) return bestQuote;

    if (!isNativeOrWrapped(tokenIn.toLowerCase()) && !isNativeOrWrapped(tokenOut.toLowerCase())) {
        // Find TokenIn -> WBNB
        // Note: We use original tokenIn for recursive call, but target WBNB address
        const hop1 = await this.getBestQuote(tokenIn, WBNB_ADDRESS, amountInStr, decimalsIn, 18);
        if (hop1 && parseFloat(hop1.amountOut) > 0) {
            // Find WBNB -> TokenOut
            const hop2 = await this.getBestQuote(WBNB_ADDRESS, tokenOut, hop1.amountOut, 18, decimalsOut);
            if (hop2 && parseFloat(hop2.amountOut) > 0) {
                 return {
                    // Let's assume if both are V2, we use V2 routing.
                    // If any is V3, we use V3 multihop (if compatible) or fail for now.
                    // The ABI has `eagleSwapV2Router` which takes `address[] path`.
                    
                    quoteType: (hop1.quoteType === 'V2' && hop2.quoteType === 'V2') ? 'V2' : 'V3',
                    amountOut: hop2.amountOut,
                    path: [tokenIn, WBNB_ADDRESS, tokenOut], // Contract handles WBNB in path
                    fees: hop1.fees + hop2.fees,
                    priceImpact: '0.00'
                 };
            }
        }
    }

    return null;
  }

  /**
   * Get V2 Quote directly from RPC (Fallback)
   */
  async getV2QuoteRPC(tokenIn: string, tokenOut: string, amountIn: bigint, decimalsOut: number): Promise<bigint | null> {
    try {
        const provider = await WalletService.getProvider();
        const factory = new ethers.Contract(PANCAKESWAP_V2_FACTORY, FACTORY_ABI, provider);
        
        const pairAddress = await factory.getPair(tokenIn, tokenOut);
        if (pairAddress === ethers.ZeroAddress) return null;

        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        
        const isToken0In = token0.toLowerCase() === tokenIn.toLowerCase();
        const reserveIn = isToken0In ? reserve0 : reserve1;
        const reserveOut = isToken0In ? reserve1 : reserve0;

        return this.calculateV2AmountOut(amountIn, BigInt(reserveIn), BigInt(reserveOut));
    } catch (error) {
        console.error('Error getting RPC quote:', error);
        return null;
    }
  }

  /**
   * Find best liquidity pool for a token via GraphQL (Legacy/Info)
   */
  async findBestLiquidity(tokenAddress: string): Promise<LiquidityResult | null> {
    try {
      const addr = tokenAddress.toLowerCase();
      
      const query = `
        query getLiquidity($tokenAddress: String!) {
          v2As0: pairs(where: {token0: $tokenAddress}, orderBy: reserveUSD, orderDirection: desc, first: 5) {
            id
            reserveUSD
            token0 { symbol }
            token1 { symbol }
          }
          v2As1: pairs(where: {token1: $tokenAddress}, orderBy: reserveUSD, orderDirection: desc, first: 5) {
            id
            reserveUSD
            token0 { symbol }
            token1 { symbol }
          }
          v3As0: pools(where: {token0: $tokenAddress}, orderBy: totalValueLockedUSD, orderDirection: desc, first: 5) {
            id
            totalValueLockedUSD
            feeTier
            token0 { symbol }
            token1 { symbol }
          }
          v3As1: pools(where: {token1: $tokenAddress}, orderBy: totalValueLockedUSD, orderDirection: desc, first: 5) {
            id
            totalValueLockedUSD
            feeTier
            token0 { symbol }
            token1 { symbol }
          }
        }
      `;

      const response = await fetch('https://dex.eagleswap.io/subgraphs/name/eagle-swap/pancakeswap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { tokenAddress: addr }
        })
      });

      const { data } = await response.json();
      
      if (!data) return null;

      let bestPool: LiquidityResult | null = null;
      let maxLiquidity = 0;

      // Process V2 Data
      const v2Pairs = [...(data.v2As0 || []), ...(data.v2As1 || [])];
      v2Pairs.forEach((pair: any) => {
        const liq = parseFloat(pair.reserveUSD);
        if (liq > maxLiquidity) {
          maxLiquidity = liq;
          bestPool = {
            protocol: 'V2',
            address: pair.id,
            liquidityUSD: liq,
            pairName: `${pair.token0.symbol}/${pair.token1.symbol}` 
          };
        }
      });

      // Process V3 Data
      const v3Pools = [...(data.v3As0 || []), ...(data.v3As1 || [])];
      v3Pools.forEach((pool: any) => {
        const liq = parseFloat(pool.totalValueLockedUSD);
        if (liq > maxLiquidity) {
          maxLiquidity = liq;
          bestPool = {
            protocol: 'V3',
            address: pool.id,
            liquidityUSD: liq,
            feeTier: parseInt(pool.feeTier),
            pairName: `${pool.token0.symbol}/${pool.token1.symbol}` 
          };
        }
      });

      return bestPool;
    } catch (error) {
      console.error('Error finding best liquidity:', error);
      return null;
    }
  }

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
      
      const aggregatorAddress = AGGREGATOR_CONTRACTS[chainId];
      const routerV2 = '0x10ED43C718714eb63d5aA57B78B54704E256024E'; // PancakeSwap V2 Router
      const routerV3 = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'; // PancakeSwap V3 Router (Universal)

      // Check if token needs approval
      if (quote.fromToken !== ethers.ZeroAddress) {
        await this.approveToken(
          quote.fromToken,
          aggregatorAddress,
          quote.fromAmount,
          connectedWallet
        );
      }

      // Get aggregator contract
      const contract = new ethers.Contract(
        aggregatorAddress,
        AGGREGATOR_ABI,
        connectedWallet
      );

      // Execute swap based on type
      let tx;
      const value = quote.fromToken === ethers.ZeroAddress ? quote.fromAmount : '0';

      if (quote.quoteType === 'V2') {
        // V2 Swap - Use SupportingFee variant for better compatibility with tax tokens
        tx = await contract.eagleSwapV2RouterSupportingFee(
          routerV2,
          quote.path,
          quote.fromAmount,
          quote.toAmountMin,
          { value }
        );
      } else {
        // V3 Swap
        if (quote.path.length === 2) {
          // V3 Direct
          // Encode path: tokenIn + fee + tokenOut (Standard V3 encoding)
          // Actually eagleSwapV3Direct takes bytes path? No, looking at ABI:
          // function eagleSwapV3Direct(address router, bytes calldata path, address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut)
          
          // We need to encode the path for V3.
          // Format: [tokenIn (20)][fee (3)][tokenOut (20)]
          const fee = quote.fees || 2500; // Default 0.25% if missing
          const pathTypes = ['address', 'uint24', 'address'];
          const pathValues = [quote.fromToken, fee, quote.toToken];
          
          // Note: ethers solidityPacked is needed for path encoding
          // But eagleSwapV3Direct signature implies it handles it? 
          // Let's look at the ABI again: `bytes calldata path`
          // Typically V3 paths are packed bytes.
          
          const encodedPath = ethers.solidityPacked(
             ['address', 'uint24', 'address'],
             [quote.fromToken, fee, quote.toToken]
          );

          tx = await contract.eagleSwapV3Direct(
            routerV3,
            encodedPath,
            quote.fromToken,
            quote.toToken,
            quote.fromAmount,
            quote.toAmountMin,
            { value }
          );
        } else {
          // V3 Multi-hop
          // Encode path: tokenIn + fee + tokenMid + fee + tokenOut
          // This is complex without the fee info for each hop.
          // For now, assuming fixed fee or we need fees in path.
          // Our getBestQuote returns simple path. We'll assume 2500 fee for hops if not provided.
          
          const types = [];
          const values = [];
          for (let i = 0; i < quote.path.length; i++) {
             types.push('address');
             values.push(quote.path[i]);
             if (i < quote.path.length - 1) {
                 types.push('uint24');
                 values.push(quote.fees || 2500); // Approximation
             }
          }
          
          const encodedPath = ethers.solidityPacked(types, values);

          tx = await contract.eagleSwapV3RouterMultiHop(
            routerV3,
            encodedPath,
            quote.fromToken,
            quote.toToken,
            quote.fromAmount,
            quote.toAmountMin,
            { value }
          );
        }
      }

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
