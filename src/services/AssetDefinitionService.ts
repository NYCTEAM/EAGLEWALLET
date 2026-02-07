/**
 * Eagle Wallet - Asset Definition Service
 * Handles metadata parsing, TokenScript support, and XML definitions
 * Parity with AlphaWallet's AssetDefinitionService
 */

export interface AssetAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface AssetMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: AssetAttribute[];
  animation_url?: string;
}

class AssetDefinitionService {
  /**
   * Parse token URI and fetch metadata
   */
  async resolveTokenMetadata(uri: string): Promise<AssetMetadata> {
    if (!uri) return {};

    try {
      const normalizedUri = this.normalizeIpfs(uri);
      
      // Handle data URIs
      if (normalizedUri.startsWith('data:application/json;base64,')) {
        const json = Buffer.from(normalizedUri.split(',')[1], 'base64').toString();
        return JSON.parse(json);
      }

      // Fetch from HTTP
      if (normalizedUri.startsWith('http')) {
        const response = await fetch(normalizedUri);
        if (response.ok) {
          return await response.json();
        }
      }

      return {};
    } catch (error) {
      console.error('Error resolving metadata:', error);
      return {};
    }
  }

  /**
   * Normalize IPFS links to use a gateway
   */
  private normalizeIpfs(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return uri;
  }

  /**
   * Get formatting contract (Placeholder for TokenScript)
   */
  async getFormattingContract(contractAddress: string, chainId: number) {
    // This would load TokenScript XML in a full implementation
    return null;
  }
}

export default new AssetDefinitionService();
