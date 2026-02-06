/**
 * Eagle Wallet - Smart RPC Service
 * Automatically detects and switches to fastest RPC node (US/HK)
 */

import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';

interface RPCLatency {
  url: string;
  latency: number;
  available: boolean;
}

class RPCService {
  private latencyCache: Map<string, RPCLatency> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCheck: Map<string, number> = new Map();

  /**
   * Test RPC node latency
   */
  async testRPCLatency(rpcUrl: string, fetchOptions?: any): Promise<number> {
    const startTime = Date.now();
    
    try {
      // Create FetchRequest with custom headers if needed
      let provider;
      if (fetchOptions) {
        const fetchReq = new ethers.FetchRequest(rpcUrl);
        if (fetchOptions.headers) {
          Object.keys(fetchOptions.headers).forEach(key => {
            fetchReq.setHeader(key, fetchOptions.headers[key]);
          });
        }
        provider = new ethers.JsonRpcProvider(fetchReq);
      } else {
        provider = new ethers.JsonRpcProvider(rpcUrl);
      }
      
      await provider.getBlockNumber();
      const latency = Date.now() - startTime;
      
      // Cache result
      this.latencyCache.set(rpcUrl, {
        url: rpcUrl,
        latency,
        available: true,
      });
      this.lastCheck.set(rpcUrl, Date.now());
      
      return latency;
    } catch (error) {
      console.error(`RPC ${rpcUrl} failed:`, error);
      
      // Mark as unavailable
      this.latencyCache.set(rpcUrl, {
        url: rpcUrl,
        latency: 999999,
        available: false,
      });
      this.lastCheck.set(rpcUrl, Date.now());
      
      return 999999;
    }
  }

  /**
   * Get cached latency or test if expired
   */
  async getLatency(rpcUrl: string): Promise<number> {
    const lastCheckTime = this.lastCheck.get(rpcUrl) || 0;
    const now = Date.now();
    
    // Use cache if not expired
    if (now - lastCheckTime < this.cacheExpiry) {
      const cached = this.latencyCache.get(rpcUrl);
      if (cached) {
        return cached.latency;
      }
    }
    
    // Test latency
    return await this.testRPCLatency(rpcUrl);
  }

  /**
   * Find fastest RPC node for a chain
   */
  async getFastestRPC(chainId: number): Promise<string> {
    const network = NETWORKS[chainId];
    if (!network || !network.rpcNodes || network.rpcNodes.length === 0) {
      throw new Error(`No RPC nodes configured for chain ${chainId}`);
    }

    console.log(`🔍 Testing ${network.rpcNodes.length} RPC nodes for ${network.name}...`);

    // Test all RPCs in parallel
    const latencyTests = network.rpcNodes.map(async (node) => {
      const latency = await this.testRPCLatency(node.url, node.fetchOptions);
      return { 
        name: node.name, 
        url: node.url, 
        region: node.region,
        latency,
        fetchOptions: node.fetchOptions
      };
    });

    const results = await Promise.all(latencyTests);
    
    // Sort by latency (fastest first)
    results.sort((a, b) => a.latency - b.latency);
    
    // Log results (显示名称，隐藏 URL)
    console.log('📊 RPC Node Status:');
    results.forEach((result, index) => {
      const status = result.latency < 999999 ? '✅' : '❌';
      const latencyStr = result.latency < 999999 ? `${result.latency}ms` : 'Failed';
      const region = result.region ? `[${result.region}]` : '';
      console.log(`  ${status} #${index + 1}: ${result.name} ${region} - ${latencyStr}`);
    });

    // Return fastest available RPC
    const fastest = results[0];
    if (fastest.latency < 999999) {
      console.log(`✅ Connected to: ${fastest.name} (${fastest.latency}ms)`);
      return fastest.url;
    }

    // Fallback to first URL if all failed
    console.warn('⚠️ All nodes failed, using first node as fallback');
    return network.rpcNodes[0].url;
  }

  /**
   * Get provider with automatic RPC selection
   */
  async getProvider(chainId: number): Promise<ethers.JsonRpcProvider> {
    const fastestRPC = await this.getFastestRPC(chainId);
    const network = NETWORKS[chainId];
    
    return new ethers.JsonRpcProvider(fastestRPC, {
      chainId: network.chainId,
      name: network.name,
    });
  }

  /**
   * Test all RPCs and return detailed report (显示名称，不显示 URL)
   */
  async testAllRPCs(chainId: number): Promise<Array<{
    name: string;
    region?: string;
    latency: number;
    available: boolean;
  }>> {
    const network = NETWORKS[chainId];
    if (!network || !network.rpcNodes) {
      return [];
    }

    const results = [];
    
    for (const node of network.rpcNodes) {
      const latency = await this.testRPCLatency(node.url, node.fetchOptions);
      results.push({
        name: node.name,
        region: node.region,
        latency,
        available: latency < 999999,
      });
    }

    return results.sort((a, b) => a.latency - b.latency);
  }

  /**
   * Clear latency cache
   */
  clearCache() {
    this.latencyCache.clear();
    this.lastCheck.clear();
  }

  /**
   * Get region from latency (heuristic)
   */
  getRegionFromLatency(latency: number): string {
    if (latency < 50) return '🇺🇸 US (Excellent)';
    if (latency < 100) return '🇭🇰 HK (Good)';
    if (latency < 200) return '🌏 Asia (Fair)';
    if (latency < 500) return '🌍 Global (Slow)';
    return '❌ Unavailable';
  }
}

export default new RPCService();
