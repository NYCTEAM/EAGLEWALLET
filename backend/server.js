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
app.use(express.static(path.join(__dirname, 'public'))); // Serve Web UI

// Configuration Helper
const CONFIG_FILE = path.join(__dirname, 'config.json');

// --- Search Tool Helper (Serper.dev - Free 2500/month) ---
async function searchWeb(query) {
    const apiKey = process.env.SERPER_API_KEY;
    
    if (!apiKey) {
        console.log('⚠️ No SERPER_API_KEY found, search disabled');
        return null;
    }

    try {
        console.log(`🔍 [Serper] Searching Google for: "${query}"`);
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                q: query, 
                num: 5,
                gl: 'us',
                hl: 'zh-cn'
            })
        });
        
        const data = await response.json();
        console.log(`✅ [Serper] Got ${data.organic?.length || 0} results`);
        
        if (!data.organic || data.organic.length === 0) {
            return "No search results found.";
        }
        
        // Format results with source attribution
        let formattedResults = `📰 Latest Search Results (${new Date().toLocaleString('zh-CN')}):\n\n`;
        data.organic.slice(0, 5).forEach((r, i) => {
            formattedResults += `${i + 1}. **${r.title}**\n`;
            formattedResults += `   Source: ${r.link}\n`;
            formattedResults += `   ${r.snippet}\n\n`;
        });
        
        console.log(`📤 [Serper] Returning formatted results to AI`);
        return formattedResults;
        
    } catch (error) {
        console.error('❌ [Serper] Search Error:', error.message);
        return "Error occurred while searching the web.";
    }
}

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
const RPC_API_KEY = process.env.RPC_API_KEY; // Eagle HK RPC API Key

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Initialize Ethers Provider with API Key support
let provider;
if (RPC_API_KEY) {
    // Eagle HK RPC with API key in header
    const fetchRequest = new ethers.FetchRequest(RPC_URL);
    fetchRequest.setHeader('X-API-Key', RPC_API_KEY);
    provider = new ethers.JsonRpcProvider(fetchRequest);
    console.log('✅ Using Eagle HK RPC with API key authentication');
} else {
    // Standard RPC without API key
    provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Using standard RPC:', RPC_URL);
}
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

// Health Check
app.get('/health', (req, res) => {
    res.send('Eagle AI Backend is Running 🦅');
});

// Serve Web Interface explicitly
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('Eagle AI Backend is Running 🦅 (Web Interface not found in public/index.html)');
    }
});

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

    // 4. Call OpenAI with Built-in Web Search (Responses API)
    try {
        // Safe history mapping
        const safeHistory = Array.isArray(history) ? history.map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: typeof h.content === 'string' ? h.content : ''
        })) : [];

        // Dynamic System Message with Time Context
        const now = new Date();
        const systemPrompt = `Current Date and Time: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}. 
        You are Eagle AI, a specialized crypto assistant for Eagle Wallet.
        
        IMPORTANT: When users ask about real-time information (news, current events, weather, latest prices, market movements, "why did X happen", etc.), you MUST use the search_web function to get accurate, up-to-date information.
        
        Always cite sources when using search results.`;
        
        // Construct messages array
        const messagesToSend = [
            { role: "system", content: systemPrompt },
            ...safeHistory.slice(-4),
            { role: "user", content: message }
        ];

        // Define search tool for Function Calling
        const tools = [
            {
                type: "function",
                function: {
                    name: "search_web",
                    description: "Search the web for real-time information, news, current events, weather, latest crypto prices, market movements, or any information that requires up-to-date data. Use this when the user asks about recent events, current prices, news, or anything happening 'now', 'today', 'recently', or 'latest'.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The search query. Be specific and include relevant keywords. For example: 'Bitcoin price drop February 2026' or 'Shanghai weather today'"
                            }
                        },
                        required: ["query"]
                    }
                }
            }
        ];

        console.log('📤 Sending to OpenAI with Function Calling enabled');

        // First API call - AI decides if it needs to search
        let completion = await openai.chat.completions.create({
            model: currentConfig.system_settings.openai_model,
            messages: messagesToSend,
            max_tokens: currentConfig.system_settings.max_response_tokens,
            tools: tools,
            tool_choice: "auto" // Let AI decide
        });

        let reply = completion.choices[0].message?.content || '';
        let totalTokens = completion.usage?.total_tokens || 0;
        const toolCalls = completion.choices[0].message?.tool_calls;

        // If AI wants to search, execute the search and call again
        if (toolCalls && toolCalls.length > 0) {
            console.log('🔍 AI decided to search:', toolCalls[0].function.arguments);
            
            // Add AI's message with tool calls to conversation
            messagesToSend.push(completion.choices[0].message);

            // Execute each tool call
            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'search_web') {
                    const args = JSON.parse(toolCall.function.arguments);
                    const searchResults = await searchWeb(args.query);
                    
                    console.log('✅ Search completed, results length:', searchResults?.length || 0);
                    
                    // Add search results to conversation
                    messagesToSend.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "search_web",
                        content: searchResults || "No results found."
                    });
                }
            }

            // Second API call - AI generates final answer with search results
            console.log('📤 Sending search results back to AI for final answer');
            const finalCompletion = await openai.chat.completions.create({
                model: currentConfig.system_settings.openai_model,
                messages: messagesToSend,
                max_tokens: currentConfig.system_settings.max_response_tokens
            });

            reply = finalCompletion.choices[0].message?.content || '';
            totalTokens += finalCompletion.usage?.total_tokens || 0;
        }

        if (!reply) {
            reply = "I apologize, but I couldn't generate a response. Please try again.";
        }

        console.log('✅ OpenAI Response received, total tokens used:', totalTokens);

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
        console.error('❌ Chat API Error:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Return user-friendly error
        let errorMessage = 'AI service temporarily unavailable';
        if (error.message?.includes('API key')) {
            errorMessage = 'API configuration error';
        } else if (error.message?.includes('quota')) {
            errorMessage = 'API quota exceeded';
        } else if (error.message?.includes('timeout')) {
            errorMessage = 'Request timeout';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        openai: !!OPENAI_API_KEY,
        rpc: RPC_URL,
        serper: !!process.env.SERPER_API_KEY
    });
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
