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
  type?: 'ERC721' | 'ERC1155';
  amount?: number; // For ERC1155
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

const TRANSFER_EVENT_TOPIC = ethers.id('Transfer(address,address,uint256)');
const MAX_NFTS_PER_CONTRACT = 100;
const MAX_DISCOVERY_CANDIDATES = 120;

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
      if (!ethers.isAddress(address)) {
        return [];
      }

      const nftMap = new Map<string, NFT>();
      const normalizedOwner = address.toLowerCase();

      const addNFT = (nft: NFT) => {
        const key = `${nft.contractAddress.toLowerCase()}:${nft.tokenId}`;
        if (!nftMap.has(key)) {
          nftMap.set(key, nft);
        }
      };

      // Get known NFT contracts for this chain
      const nftContracts = this.getKnownNFTContracts(chainId);

      for (const contractAddress of nftContracts) {
        try {
          const contractNFTs = await this.getNFTsFromContract(
            address,
            contractAddress,
            chainId
          );
          contractNFTs.forEach(addNFT);
        } catch (error) {
          console.error(`Error fetching NFTs from ${contractAddress}:`, error);
        }
      }

      // Discovery path: fetch recent NFT interactions from explorer and verify on-chain ownership
      const explorerCandidates = await this.getNFTCandidatesFromExplorer(address, chainId);
      for (const candidate of explorerCandidates) {
        const key = `${candidate.contractAddress.toLowerCase()}:${candidate.tokenId}`;
        if (nftMap.has(key)) {
          continue;
        }

        const isOwned = await this.ownsNFT(
          normalizedOwner,
          candidate.contractAddress,
          candidate.tokenId,
          chainId
        );
        if (!isOwned) {
          continue;
        }

        const details = await this.getNFTDetails(
          candidate.contractAddress,
          candidate.tokenId,
          chainId
        );
        if (details) {
          addNFT(details);
        }
      }

      return Array.from(nftMap.values());
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
      if (balanceNum <= 0) {
        return [];
      }

      // Get collection info
      let collectionName = 'Unknown Collection';
      try {
        collectionName = await contract.name();
      } catch (e) {
        // Some contracts don't have name()
      }

      // Enumerable path
      let supportsEnumerable = true;
      try {
        await contract.tokenOfOwnerByIndex(ownerAddress, 0);
      } catch {
        supportsEnumerable = false;
      }

      if (supportsEnumerable) {
        for (let i = 0; i < balanceNum && i < MAX_NFTS_PER_CONTRACT; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
            const tokenIdStr = tokenId.toString();
            const metadata = await this.fetchMetadataFrom721Contract(contract, tokenIdStr);

            nfts.push({
              tokenId: tokenIdStr,
              contractAddress,
              name: metadata.name || `#${tokenIdStr}`,
              description: metadata.description || '',
              image: this.extractImage(metadata),
              collection: collectionName,
              chainId,
              type: 'ERC721',
            });
          } catch (error) {
            console.error(`Error fetching token ${i}:`, error);
          }
        }
        return nfts;
      }

      // Non-enumerable fallback: infer owned token IDs from Transfer logs
      const inferredTokenIds = await this.getOwnedTokenIdsFromLogs(
        ownerAddress,
        contractAddress,
        chainId,
        MAX_NFTS_PER_CONTRACT
      );

      for (const tokenIdStr of inferredTokenIds) {
        try {
          const isOwned = await this.ownsNFT(ownerAddress, contractAddress, tokenIdStr, chainId);
          if (!isOwned) {
            continue;
          }

          const metadata = await this.fetchMetadataFrom721Contract(contract, tokenIdStr);

          nfts.push({
            tokenId: tokenIdStr,
            contractAddress,
            name: metadata.name || `#${tokenIdStr}`,
            description: metadata.description || '',
            image: this.extractImage(metadata),
            collection: collectionName,
            chainId,
            type: 'ERC721',
          });
        } catch (error) {
          console.error(`Error fetching token ${tokenIdStr}:`, error);
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
      // Handle data URIs
      if (uri.startsWith('data:')) {
        return this.parseDataUriMetadata(uri);
      }

      // Normalize IPFS URLs
      const normalizedURI = this.normalizeIPFS(uri);

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

    if (url.startsWith('ipfs://ipfs/')) {
      return url.replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/');
    }

    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    if (url.startsWith('ipfs/')) {
      return `https://ipfs.io/ipfs/${url.slice(5)}`;
    }

    return url;
  }

  private parseDataUriMetadata(uri: string): any {
    try {
      const commaIndex = uri.indexOf(',');
      if (commaIndex < 0) {
        return {};
      }

      const header = uri.slice(0, commaIndex);
      const payload = uri.slice(commaIndex + 1);

      if (header.includes(';base64')) {
        if (typeof globalThis.atob !== 'function') {
          return {};
        }
        const jsonString = globalThis.atob(payload);
        return JSON.parse(jsonString);
      }

      return JSON.parse(decodeURIComponent(payload));
    } catch {
      return {};
    }
  }

  private resolveTokenURI(templateUri: string, tokenId: string): string {
    if (!templateUri) {
      return '';
    }

    if (templateUri.includes('{id}')) {
      const hexTokenId = ethers.toBeHex(BigInt(tokenId), 32).replace('0x', '');
      return templateUri.replace('{id}', hexTokenId);
    }

    return templateUri;
  }

  private extractImage(metadata: any): string {
    const image = metadata?.image || metadata?.image_url || metadata?.imageUrl || '';
    return this.normalizeIPFS(image);
  }

  private async fetchMetadataFrom721Contract(contract: ethers.Contract, tokenId: string): Promise<any> {
    try {
      const tokenURI = await contract.tokenURI(tokenId);
      const resolved = this.resolveTokenURI(tokenURI, tokenId);
      return this.fetchNFTMetadata(resolved);
    } catch {
      return {};
    }
  }

  /**
   * Get known NFT contracts for a chain
   */
  private getKnownNFTContracts(chainId: number): string[] {
    // Popular NFT contracts on BSC
    const contracts: Record<number, string[]> = {
      // BSC Mainnet
      56: [
        '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // PancakeSwap NFT
        '0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07', // Pancake Squad
        // Add more popular BSC NFT contracts
      ],
    };

    return contracts[chainId] || [];
  }

  /**
   * Discover NFT candidates via explorer APIs, then verify ownership on-chain
   */
  private async getNFTCandidatesFromExplorer(
    address: string,
    chainId: number
  ): Promise<Array<{ contractAddress: string; tokenId: string }>> {
    try {
      if (chainId !== 56) {
        return [];
      }

      const url =
        `https://api.bscscan.com/api?module=account&action=tokennfttx&address=${address}` +
        `&page=1&offset=${MAX_DISCOVERY_CANDIDATES}&sort=desc`;
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data?.result)) {
        return [];
      }

      const unique = new Map<string, { contractAddress: string; tokenId: string }>();
      for (const row of data.result) {
        const contractAddress = String(row?.contractAddress || '');
        const tokenId = String(row?.tokenID || '');
        if (!ethers.isAddress(contractAddress) || tokenId === '') {
          continue;
        }

        const key = `${contractAddress.toLowerCase()}:${tokenId}`;
        if (!unique.has(key)) {
          unique.set(key, { contractAddress, tokenId });
        }

        if (unique.size >= MAX_DISCOVERY_CANDIDATES) {
          break;
        }
      }

      return Array.from(unique.values());
    } catch (error) {
      console.error('Error fetching NFT candidates from explorer:', error);
      return [];
    }
  }

  private async getOwnedTokenIdsFromLogs(
    ownerAddress: string,
    contractAddress: string,
    chainId: number,
    maxTokens: number
  ): Promise<string[]> {
    try {
      const provider = this.getProvider(chainId);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 500000);
      const ownerTopic = ethers.zeroPadValue(ownerAddress, 32);

      const [receivedLogs, sentLogs] = await Promise.all([
        provider.getLogs({
          address: contractAddress,
          fromBlock,
          toBlock: currentBlock,
          topics: [TRANSFER_EVENT_TOPIC, null, ownerTopic],
        }),
        provider.getLogs({
          address: contractAddress,
          fromBlock,
          toBlock: currentBlock,
          topics: [TRANSFER_EVENT_TOPIC, ownerTopic, null],
        }),
      ]);

      const owned = new Set<string>();
      for (const log of receivedLogs) {
        if (log.topics.length < 4) continue;
        owned.add(ethers.toBigInt(log.topics[3]).toString());
      }
      for (const log of sentLogs) {
        if (log.topics.length < 4) continue;
        owned.delete(ethers.toBigInt(log.topics[3]).toString());
      }

      return Array.from(owned).slice(0, maxTokens);
    } catch {
      return [];
    }
  }

  /**
   * Transfer NFT to another address
   */
  async transferNFT(
    wallet: ethers.Wallet | ethers.HDNodeWallet,
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
      const erc721 = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      let tokenURI = '';
      let collectionName = 'Unknown Collection';
      let type: 'ERC721' | 'ERC1155' = 'ERC721';

      try {
        tokenURI = await erc721.tokenURI(tokenId);
        collectionName = await erc721.name();
      } catch {
        // ERC1155 fallback
        const erc1155 = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
        tokenURI = await erc1155.uri(tokenId);
        type = 'ERC1155';
      }

      const metadata = await this.fetchNFTMetadata(this.resolveTokenURI(tokenURI, tokenId));

      return {
        tokenId,
        contractAddress,
        name: metadata.name || `#${tokenId}`,
        description: metadata.description || '',
        image: this.extractImage(metadata),
        collection: collectionName,
        chainId,
        type,
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
      const erc721 = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      const owner = await erc721.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      try {
        const provider = this.getProvider(chainId);
        const erc1155 = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
        const balance = await erc1155.balanceOf(address, tokenId);
        return BigInt(balance) > 0n;
      } catch {
        return false;
      }
    }
  }
}

export default new NFTService();
