require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration Helper
const CONFIG_FILE = path.join(__dirname, 'config.json');

const getConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading config file:", e);
    }
    // Default fallback
    return {
        system_settings: { openai_model: "gpt-4o-mini", max_response_tokens: 1000 },
        limits: { free: 5000, vip: 50000 },
        nft_config: { contract_address: process.env.NFT_CONTRACT_ADDRESS || '0x3c117d186c5055071eff91d87f2600eaf88d591d', required_balance: 1 },
        prompts: { system_message: "You are Eagle AI, a helpful assistant." }
    };
};

// Initial Config Load
let config = getConfig();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const APP_SECRET = process.env.APP_SECRET || 'eagle_wallet_secret_123'; // Protection header
const RPC_URL = process.env.RPC_URL || 'https://bsc-dataseed.binance.org/'; // Default BSC

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Initialize Ethers Provider
const provider = new ethers.JsonRpcProvider(RPC_URL);
const nftAbi = ["function balanceOf(address owner) view returns (uint256)"];
const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint amount) returns (bool)"
];

// Data Storage
const USAGE_FILE = path.join(__dirname, 'usage_data.json');
let usageData = {
    daily_usage: {},  // { "user_key": 1500 }
    subscriptions: {}, // { "wallet_address": 1700000000000 } (timestamp)
    processed_txs: [] // List of processed tx hashes to prevent replay
};

// Load usage data on startup
if (fs.existsSync(USAGE_FILE)) {
    try {
        const raw = JSON.parse(fs.readFileSync(USAGE_FILE));
        // Migrate old format if needed
        if (!raw.daily_usage) {
            usageData = { daily_usage: raw, subscriptions: {}, processed_txs: [] };
        } else {
            usageData = raw;
        }
    } catch (e) {
        console.error("Error reading usage file, starting fresh.");
    }
}

// Save usage data helper
const saveUsage = () => {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usageData, null, 2));
};

// Reset usage everyday at midnight
cron.schedule('0 0 * * *', () => {
    console.log('🔄 Resetting daily limits...');
    usageData.daily_usage = {}; // Clear daily usage only
    saveUsage();
});

// Helper: Get User Tier
const getUserTier = async (walletAddress) => {
    if (!walletAddress) return 'free';
    const currentConfig = getConfig();
    
    // 1. Check Subscription (Pro Tier)
    const subExpiry = usageData.subscriptions[walletAddress];
    if (subExpiry && subExpiry > Date.now()) {
        return 'pro';
    }

    try {
        // 2. Check VIP (NFT)
        const nftAddress = currentConfig.nft_config.contract_address;
        if (nftAddress && nftAddress.startsWith('0x')) {
            const nftContract = new ethers.Contract(nftAddress, nftAbi, provider);
            const balance = await nftContract.balanceOf(walletAddress);
            if (balance >= BigInt(currentConfig.nft_config.required_balance)) {
                return 'vip';
            }
        }

        // 3. Check Holder (Token)
        const tokenAddress = currentConfig.token_config.contract_address;
        if (tokenAddress && tokenAddress.startsWith('0x')) {
            const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
            const balance = await tokenContract.balanceOf(walletAddress);
            const decimals = await tokenContract.decimals();
            // Adjust balance for decimals
            const requiredAmount = ethers.parseUnits(currentConfig.token_config.required_balance.toString(), decimals);
            
            if (balance >= requiredAmount) {
                return 'holder';
            }
        }
    } catch (error) {
        console.error('Blockchain tier check failed:', error);
    }
    
    return 'free';
};

// --- Routes ---

app.get('/', (req, res) => {
    res.send('Eagle AI Backend is Running 🦅');
});

// Verify Payment & Activate Subscription
app.post('/api/verify-payment', async (req, res) => {
    const { txHash, walletAddress } = req.body;
    const authHeader = req.headers['x-app-secret'];
    const currentConfig = getConfig();

    if (authHeader !== APP_SECRET) return res.status(403).json({ error: 'Unauthorized' });
    if (!txHash || !walletAddress) return res.status(400).json({ error: 'Missing parameters' });

    // Check if tx already processed
    if (usageData.processed_txs.includes(txHash)) {
        return res.status(400).json({ error: 'Transaction already used' });
    }

    try {
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!tx || !receipt) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (receipt.status !== 1) {
            return res.status(400).json({ error: 'Transaction failed on chain' });
        }

        // Validate Transaction
        let isValid = false;
        const acceptedTokens = currentConfig.subscription.accepted_tokens || [];

        // Check if it's a Token Transfer (USDT or EAGLE)
        // We iterate through all accepted tokens to see if this tx matches any
        for (const tokenConfig of acceptedTokens) {
            if (tx.to.toLowerCase() === tokenConfig.contract_address.toLowerCase()) {
                // Parse ERC20 Transfer data
                const iface = new ethers.Interface(erc20Abi);
                try {
                    const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
                    
                    if (decoded && decoded.name === 'transfer') {
                        const [to, amount] = decoded.args;
                        if (to.toLowerCase() === currentConfig.subscription.payment_address.toLowerCase()) {
                            // Check Amount
                            const expectedAmount = ethers.parseUnits(tokenConfig.price.toString(), tokenConfig.decimals || 18);
                            if (amount >= expectedAmount) {
                                isValid = true;
                                console.log(`Payment verified: ${tokenConfig.symbol} - ${amount.toString()}`);
                                break; // Match found
                            }
                        }
                    }
                } catch (e) {
                    // Not a transfer call or parse failed, continue
                }
            }
        }

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid payment details or insufficient amount' });
        }

        // Activate Subscription
        const durationMs = currentConfig.subscription.duration_days * 24 * 60 * 60 * 1000;
        const newExpiry = Date.now() + durationMs;
        
        usageData.subscriptions[walletAddress] = newExpiry;
        usageData.processed_txs.push(txHash);
        saveUsage();

        res.json({ success: true, expiry: newExpiry, tier: 'pro' });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/chat', async (req, res) => {
    // Reload config on every request for "Hot Reload" via File Manager
    const currentConfig = getConfig();
    
    const { message, history, deviceId, walletAddress } = req.body;
    const authHeader = req.headers['x-app-secret'];

    // 1. Basic Security Check
    if (authHeader !== APP_SECRET) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!message) {
        return res.status(400).json({ error: 'Message required' });
    }

    // 2. Identify User & Check Tier
    // Key for usage tracking: Wallet Address (if connected) OR Device ID
    const userKey = walletAddress || deviceId;
    
    if (!userKey) {
        return res.status(400).json({ error: 'Identification required' });
    }

    // Determine Tier
    let tier = 'free';
    // If no wallet connected, they are always free (unless we track subs by device, but wallet is better)
    if (walletAddress) {
        tier = await getUserTier(walletAddress);
    }

    // 3. Check Daily Limit
    const currentUsage = usageData.daily_usage[userKey] || 0;
    
    // Map tier to config limit
    let limit = currentConfig.limits.free_daily_tokens;
    if (tier === 'holder') limit = currentConfig.limits.holder_daily_tokens;
    if (tier === 'vip') limit = currentConfig.limits.vip_daily_tokens;
    if (tier === 'pro') limit = currentConfig.limits.pro_daily_tokens;

    if (currentUsage >= limit) {
        return res.status(429).json({ 
            error: 'Daily limit reached', 
            limit,
            tier,
            upgradeRequired: tier === 'free'
        });
    }

    // 4. Call OpenAI
    try {
        // Construct messages array
        const messagesToSend = [
            { role: "system", content: currentConfig.prompts.system_message },
            ...(history || []).slice(-4), // Only keep last 4 turns for context
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            messages: messagesToSend,
            model: currentConfig.system_settings.openai_model, // Use model from config
            max_tokens: currentConfig.system_settings.max_response_tokens,
        });

        const reply = completion.choices[0].message.content;
        const totalTokens = completion.usage.total_tokens;

        // 5. Update Usage
        usageData.daily_usage[userKey] = currentUsage + totalTokens;
        saveUsage();

        // 6. Return Response
        res.json({
            reply,
            tier,
            tokensUsed: totalTokens,
            remaining: Math.max(0, limit - usageData.daily_usage[userKey])
        });

    } catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({ error: 'AI Service currently unavailable' });
    }
});

app.get('/api/status', async (req, res) => {
    const currentConfig = getConfig();
    const { deviceId, walletAddress } = req.query;
    const userKey = walletAddress || deviceId;
    
    if (!userKey) return res.json({ tier: 'free', remaining: 0 });

    let tier = 'free';
    let subscriptionExpiry = null;
    
    if (walletAddress) {
        tier = await getUserTier(walletAddress);
        subscriptionExpiry = usageData.subscriptions[walletAddress] || null;
    }

    const currentUsage = usageData.daily_usage[userKey] || 0;
    
    let limit = currentConfig.limits.free_daily_tokens;
    if (tier === 'holder') limit = currentConfig.limits.holder_daily_tokens;
    if (tier === 'vip') limit = currentConfig.limits.vip_daily_tokens;
    if (tier === 'pro') limit = currentConfig.limits.pro_daily_tokens;

    res.json({
        tier,
        used: currentUsage,
        limit,
        remaining: Math.max(0, limit - currentUsage),
        subscriptionExpiry
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
