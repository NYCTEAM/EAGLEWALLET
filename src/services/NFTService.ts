/**
 * Eagle Wallet - NFT Service
 * Automatically fetch and display user's NFTs
 */

import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';

export interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  chainId: number;
}

// ERC-721 ABI for NFT operations
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

// ERC-1155 ABI for multi-token NFTs
const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function uri(uint256 id) view returns (string)',
];

class NFTService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  /**
   * Get provider for specific chain
   */
  private getProvider(chainId: number): ethers.JsonRpcProvider {
    if (!this.providers.has(chainId)) {
      const network = NETWORKS[chainId];
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }
      const provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
        chainId: network.chainId,
        name: network.name,
      });
      this.providers.set(chainId, provider);
    }
    return this.providers.get(chainId)!;
  }

  /**
   * Get all NFTs owned by an address
   */
  async getUserNFTs(address: string, chainId: number): Promise<NFT[]> {
    try {
      const nfts: NFT[] = [];
      
      // Get known NFT contracts for this chain
      const nftContracts = this.getKnownNFTContracts(chainId);
      
      for (const contractAddress of nftContracts) {
        try {
          const contractNFTs = await this.getNFTsFromContract(
            address,
            contractAddress,
            chainId
          );
          nfts.push(...contractNFTs);
        } catch (error) {
          console.error(`Error fetching NFTs from ${contractAddress}:`, error);
        }
      }

      // Also scan for NFTs using Moralis/Alchemy API if available
      const apiNFTs = await this.getNFTsFromAPI(address, chainId);
      nfts.push(...apiNFTs);

      return nfts;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFTs from a specific contract
   */
  private async getNFTsFromContract(
    ownerAddress: string,
    contractAddress: string,
    chainId: number
  ): Promise<NFT[]> {
    const provider = this.getProvider(chainId);
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    const nfts: NFT[] = [];

    try {
      // Get balance
      const balance = await contract.balanceOf(ownerAddress);
      const balanceNum = Number(balance);

      // Get collection info
      let collectionName = 'Unknown Collection';
      try {
        collectionName = await contract.name();
      } catch (e) {
        // Some contracts don't have name()
      }

      // Fetch each NFT
      for (let i = 0; i < balanceNum && i < 50; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
          const tokenIdStr = tokenId.toString();

          // Get token URI
          let tokenURI = '';
          try {
            tokenURI = await contract.tokenURI(tokenId);
          } catch (e) {
            console.log(`No tokenURI for ${tokenIdStr}`);
          }

          // Fetch metadata
          const metadata = await this.fetchNFTMetadata(tokenURI);

          nfts.push({
            tokenId: tokenIdStr,
            contractAddress,
            name: metadata.name || `#${tokenIdStr}`,
            description: metadata.description || '',
            image: this.normalizeIPFS(metadata.image || ''),
            collection: collectionName,
            chainId,
          });
        } catch (error) {
          console.error(`Error fetching token ${i}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in getNFTsFromContract:', error);
    }

    return nfts;
  }

  /**
   * Fetch NFT metadata from URI
   */
  private async fetchNFTMetadata(uri: string): Promise<any> {
    if (!uri) return {};

    try {
      // Normalize IPFS URLs
      const normalizedURI = this.normalizeIPFS(uri);
      
      // Handle data URIs
      if (normalizedURI.startsWith('data:')) {
        const json = normalizedURI.split(',')[1];
        return JSON.parse(Buffer.from(json, 'base64').toString());
      }

      // Fetch from HTTP
      const response = await fetch(normalizedURI);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return {};
    }
  }

  /**
   * Convert IPFS URLs to HTTP gateway URLs
   */
  private normalizeIPFS(url: string): string {
    if (!url) return '';
    
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    if (url.startsWith('ipfs/')) {
      return `https://ipfs.io/ipfs/${url.slice(5)}`;
    }
    
    return url;
  }

  /**
   * Get known NFT contracts for a chain
   */
  private getKnownNFTContracts(chainId: number): string[] {
    // Popular NFT contracts on BSC and XLAYER
    const contracts: Record<number, string[]> = {
      // BSC Mainnet
      56: [
        '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // PancakeSwap NFT
        '0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07', // Pancake Squad
        // Add more popular BSC NFT contracts
      ],
      // XLAYER Mainnet
      196: [
        // Add XLAYER NFT contracts when available
      ],
    };

    return contracts[chainId] || [];
  }

  /**
   * Get NFTs using external API (Moralis, Alchemy, etc.)
   */
  private async getNFTsFromAPI(
    address: string,
    chainId: number
  ): Promise<NFT[]> {
    // This would integrate with Moralis, Alchemy, or similar services
    // For now, return empty array
    // You can add API keys in environment variables
    
    try {
      // Example: Moralis API
      // const response = await fetch(
      //   `https://deep-index.moralis.io/api/v2/${address}/nft?chain=${chainId}`,
      //   {
      //     headers: {
      //       'X-API-Key': process.env.MORALIS_API_KEY,
      //     },
      //   }
      // );
      // const data = await response.json();
      // return this.parseAPIResponse(data);
      
      return [];
    } catch (error) {
      console.error('Error fetching NFTs from API:', error);
      return [];
    }
  }

  /**
   * Transfer NFT to another address
   */
  async transferNFT(
    wallet: ethers.Wallet,
    contractAddress: string,
    tokenId: string,
    toAddress: string,
    chainId: number
  ): Promise<string> {
    const provider = this.getProvider(chainId);
    const connectedWallet = wallet.connect(provider);
    const contract = new ethers.Contract(
      contractAddress,
      [
        'function safeTransferFrom(address from, address to, uint256 tokenId)',
      ],
      connectedWallet
    );

    const tx = await contract.safeTransferFrom(
      wallet.address,
      toAddress,
      tokenId
    );
    await tx.wait();
    return tx.hash;
  }

  /**
   * Get NFT details
   */
  async getNFTDetails(
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<NFT | null> {
    try {
      const provider = this.getProvider(chainId);
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);

      const tokenURI = await contract.tokenURI(tokenId);
      const metadata = await this.fetchNFTMetadata(tokenURI);
      const collectionName = await contract.name();

      return {
        tokenId,
        contractAddress,
        name: metadata.name || `#${tokenId}`,
        description: metadata.description || '',
        image: this.normalizeIPFS(metadata.image || ''),
        collection: collectionName,
        chainId,
      };
    } catch (error) {
      console.error('Error getting NFT details:', error);
      return null;
    }
  }

  /**
   * Check if address owns a specific NFT
   */
  async ownsNFT(
    address: string,
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<boolean> {
    try {
      const provider = this.getProvider(chainId);
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      const owner = await contract.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}

export default new NFTService();
