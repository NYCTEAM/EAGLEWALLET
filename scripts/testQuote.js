
const { ethers } = require('ethers');

const RPC_URL = 'https://bsc-dataseed.binance.org/';
const AGGREGATOR_ADDRESS = '0xF78D10CbbEBfD569f818faC8BA9697C6EebEFF9E';

// ABI from previous version that had getBestRate
const OLD_ABI = [
  'function getBestRate(uint256 amountIn, address tokenIn, address tokenOut) external view returns (uint256 amountOut, uint256 dexId, address[] memory path)'
];

// Standard PancakeSwap V2 Router
const ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
];

// PancakeSwap V3 Quoter V2
const QUOTER_ADDRESS = '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997';
const QUOTER_ABI = [
    'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
];

const BNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'; // WBNB
const USDT = '0x55d398326f99059ff775485246999027b3197955';

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const amountIn = ethers.parseEther('1.0'); // 1 BNB

    console.log('Testing Quote for 1 BNB -> USDT');

    // 1. Test PancakeSwap V2 Router getAmountsOut
    try {
        console.log('\n--- Testing PancakeSwap V2 Router getAmountsOut ---');
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
        const amounts = await router.getAmountsOut(amountIn, [BNB, USDT]);
        console.log('V2 Result:', amounts);
        console.log('V2 Amount Out:', ethers.formatUnits(amounts[1], 18));
    } catch (e) {
        console.log('Router getAmountsOut failed:', e.message);
    }

    // 2. Test PancakeSwap V3 Quoter
    try {
        console.log('\n--- Testing PancakeSwap V3 Quoter ---');
        const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
        
        // Check common fee tiers
        const fees = [100, 500, 2500, 10000]; // 0.01%, 0.05%, 0.25%, 1%
        
        for (const fee of fees) {
            try {
                const params = {
                    tokenIn: BNB,
                    tokenOut: USDT,
                    amountIn: amountIn,
                    fee: fee,
                    sqrtPriceLimitX96: 0
                };
                
                // Static call to simulate transaction and get return value
                const result = await quoter.quoteExactInputSingle.staticCall(params);
                console.log(`V3 Fee ${fee} (${fee/10000}%): ${ethers.formatUnits(result[0], 18)} USDT`);
            } catch (e) {
                // console.log(`V3 Fee ${fee} failed: Pool might not exist or low liquidity`);
            }
        }
    } catch (e) {
        console.log('V3 Quoter failed:', e.message);
    }
}

main();
