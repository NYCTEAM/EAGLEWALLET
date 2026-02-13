/**
 * Eagle Wallet - NFT Service
 * Automatically fetch and display user's NFTs
 */

import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';
import RPCService from './RPCService';
import { toIpfsGatewayCandidates, normalizeNftUrl } from '../utils/nftMedia';

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
const TRANSFER_SINGLE_EVENT_TOPIC = ethers.id('TransferSingle(address,address,address,uint256,uint256)');
const TRANSFER_BATCH_EVENT_TOPIC = ethers.id('TransferBatch(address,address,address,uint256[],uint256[])');
const MAX_NFTS_PER_CONTRACT = 100;
const MAX_DISCOVERY_CANDIDATES = 120;
const TRANSFER_SCAN_BLOCK_STEP = 20000;
const METADATA_FETCH_TIMEOUT_MS = 6000;

const ERC1155_TRANSFER_INTERFACE = new ethers.Interface([
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
]);

type NFTCandidate = {
  contractAddress: string;
  tokenId: string;
  type?: 'ERC721' | 'ERC1155';
  nameHint?: string;
  blockNumber?: number;
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = (() => {
  const table = new Uint8Array(256);
  table.fill(255);
  for (let i = 0; i < BASE64_ALPHABET.length; i += 1) {
    table[BASE64_ALPHABET.charCodeAt(i)] = i;
  }
  return table;
})();

class NFTService {
  private providers: Map<number, { url: string; provider: ethers.JsonRpcProvider }> = new Map();
  private metadataCache = new Map<string, { value: any; timestamp: number }>();
  private metadataCacheTTL = 10 * 60 * 1000;

  /**
   * Get provider for specific chain
   */
  private async getProvider(chainId: number): Promise<ethers.JsonRpcProvider> {
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    const preferred = await RPCService.getPreferredRpcUrl(chainId);
    const cached = this.providers.get(chainId);
    if (cached && cached.url === preferred) {
      return cached.provider;
    }

    const provider = new ethers.JsonRpcProvider(preferred, {
      chainId: network.chainId,
      name: network.name,
    });
    this.providers.set(chainId, { url: preferred, provider });
    return provider;
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

      // Discovery path: scan on-chain transfer logs via the wallet RPC and verify ownership
      const transferCandidates = await this.getNFTCandidatesFromTransfers(address, chainId);
      for (const candidate of transferCandidates) {
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
          chainId,
          candidate.type,
          candidate.nameHint
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
    const provider = await this.getProvider(chainId);
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
      const cacheKey = uri.trim();
      const cached = this.metadataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.metadataCacheTTL) {
        return cached.value;
      }

      // Handle data URIs
      if (uri.startsWith('data:')) {
        const parsed = this.parseDataUriMetadata(uri);
        this.metadataCache.set(cacheKey, { value: parsed, timestamp: Date.now() });
        return parsed;
      }

      if (uri.trim().startsWith('{') || uri.trim().startsWith('[')) {
        const parsed = JSON.parse(uri.trim());
        this.metadataCache.set(cacheKey, { value: parsed, timestamp: Date.now() });
        return parsed;
      }

      const candidates = this.buildMetadataUriCandidates(uri);
      for (const candidate of candidates) {
        try {
          const parsed = await this.fetchJsonWithTimeout(candidate);
          if (parsed && typeof parsed === 'object') {
            this.metadataCache.set(cacheKey, { value: parsed, timestamp: Date.now() });
            return parsed;
          }
        } catch {
          // try next gateway candidate
        }
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }

    return {};
  }

  /**
   * Convert IPFS URLs to HTTP gateway URLs
   */
  private normalizeIPFS(url: string): string {
    return normalizeNftUrl(url);
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
        let bytes: Uint8Array;
        try {
          // ethers.decodeBase64 may rely on Buffer/atob; fallback to a pure-JS decoder for Hermes.
          bytes = ethers.decodeBase64(payload);
        } catch {
          bytes = this.decodeBase64Fallback(payload);
        }

        const jsonString = ethers.toUtf8String(bytes);
        return JSON.parse(jsonString);
      }

      return JSON.parse(decodeURIComponent(payload));
    } catch {
      return {};
    }
  }

  private decodeBase64Fallback(payload: string): Uint8Array {
    const sanitized = String(payload || '')
      .trim()
      .replace(/[\r\n\s]/g, '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    if (!sanitized) return new Uint8Array();

    const pad = sanitized.endsWith('==') ? 2 : sanitized.endsWith('=') ? 1 : 0;
    const len = sanitized.length;
    const outLen = Math.max(0, Math.floor((len * 3) / 4) - pad);
    const out = new Uint8Array(outLen);

    let outIndex = 0;
    for (let i = 0; i < len; i += 4) {
      const c1 = BASE64_LOOKUP[sanitized.charCodeAt(i)];
      const c2 = BASE64_LOOKUP[sanitized.charCodeAt(i + 1)];
      const c3 = BASE64_LOOKUP[sanitized.charCodeAt(i + 2)];
      const c4 = BASE64_LOOKUP[sanitized.charCodeAt(i + 3)];

      if (c1 === 255 || c2 === 255) break;
      const b3 = c3 === 255 ? 0 : c3;
      const b4 = c4 === 255 ? 0 : c4;

      const triple = (c1 << 18) | (c2 << 12) | ((b3 & 63) << 6) | (b4 & 63);

      if (outIndex < outLen) out[outIndex++] = (triple >> 16) & 255;
      if (outIndex < outLen) out[outIndex++] = (triple >> 8) & 255;
      if (outIndex < outLen) out[outIndex++] = triple & 255;
    }

    return out;
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
    const image =
      metadata?.image ||
      metadata?.image_url ||
      metadata?.imageUrl ||
      metadata?.image_data ||
      metadata?.imageData ||
      '';

    if (typeof image === 'string' && image.trim().startsWith('<svg')) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(image.trim())}`;
    }

    return this.normalizeIPFS(image);
  }

  private buildMetadataUriCandidates(uri: string): string[] {
    const trimmed = String(uri || '').trim();
    if (!trimmed) return [];

    const ipfsCandidates = toIpfsGatewayCandidates(trimmed);
    if (ipfsCandidates.length > 0) {
      return ipfsCandidates;
    }

    const normalized = this.normalizeIPFS(trimmed);
    return normalized ? [normalized] : [];
  }

  private async fetchJsonWithTimeout(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), METADATA_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const raw = await response.text();
      if (!raw) return {};
      return JSON.parse(raw);
    } finally {
      clearTimeout(timeoutId);
    }
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
        '0x3c117d186c5055071eff91d87f2600eaf88d591d', // Eagle Access NFT
        // Add more popular BSC NFT contracts
      ],
    };

    return contracts[chainId] || [];
  }

  private async getNFTCandidatesFromTransfers(address: string, chainId: number): Promise<NFTCandidate[]> {
    let fromLogs: NFTCandidate[] = [];
    // Progressive scan window:
    // fast path first, then expand if empty.
    const lookbackSteps = [120000, 400000, 1200000, 3000000];
    for (const lookback of lookbackSteps) {
      fromLogs = await this.getNFTCandidatesFromChainLogs(
        address,
        chainId,
        MAX_DISCOVERY_CANDIDATES,
        lookback
      );
      if (fromLogs.length > 0) {
        break;
      }
    }

    const unique = new Map<string, NFTCandidate>();
    fromLogs.forEach((candidate) => {
      const key = `${candidate.contractAddress.toLowerCase()}:${candidate.tokenId}`;
      const existing = unique.get(key);
      if (!existing) {
        unique.set(key, candidate);
        return;
      }
      unique.set(key, {
        ...existing,
        ...candidate,
        nameHint: candidate.nameHint || existing.nameHint,
        blockNumber: Math.max(existing.blockNumber || 0, candidate.blockNumber || 0),
      });
    });

    return Array.from(unique.values())
      .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))
      .slice(0, MAX_DISCOVERY_CANDIDATES);
  }

  private async getNFTCandidatesFromChainLogs(
    address: string,
    chainId: number,
    maxCandidates: number,
    lookbackBlocks: number
  ): Promise<NFTCandidate[]> {
    try {
      const provider = await this.getProvider(chainId);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - lookbackBlocks);
      const ownerTopic = ethers.zeroPadValue(ethers.getAddress(address), 32);

      const erc721State = new Map<
        string,
        { candidate: NFTCandidate; owned: boolean; lastBlock: number }
      >();
      const erc1155State = new Map<
        string,
        { candidate: NFTCandidate; balance: bigint; lastBlock: number }
      >();

      for (let start = fromBlock; start <= currentBlock; start += TRANSFER_SCAN_BLOCK_STEP) {
        const end = Math.min(currentBlock, start + TRANSFER_SCAN_BLOCK_STEP - 1);

        const [in721, out721, inSingle, outSingle, inBatch, outBatch] = await Promise.all([
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_EVENT_TOPIC, null, ownerTopic],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_EVENT_TOPIC, ownerTopic, null],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_SINGLE_EVENT_TOPIC, null, null, ownerTopic],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_SINGLE_EVENT_TOPIC, null, ownerTopic, null],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_BATCH_EVENT_TOPIC, null, null, ownerTopic],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_BATCH_EVENT_TOPIC, null, ownerTopic, null],
          }),
        ]);

        for (const log of in721) {
          if (log.topics.length < 4 || !ethers.isAddress(log.address)) continue;
          const tokenId = ethers.toBigInt(log.topics[3]).toString();
          const key = `${log.address.toLowerCase()}:${tokenId}`;
          erc721State.set(key, {
            candidate: {
              contractAddress: log.address,
              tokenId,
              type: 'ERC721',
              blockNumber: Number(log.blockNumber || 0),
            },
            owned: true,
            lastBlock: Number(log.blockNumber || 0),
          });
        }

        for (const log of out721) {
          if (log.topics.length < 4 || !ethers.isAddress(log.address)) continue;
          const tokenId = ethers.toBigInt(log.topics[3]).toString();
          const key = `${log.address.toLowerCase()}:${tokenId}`;
          const existing = erc721State.get(key) || {
            candidate: {
              contractAddress: log.address,
              tokenId,
              type: 'ERC721' as const,
              blockNumber: Number(log.blockNumber || 0),
            },
            owned: false,
            lastBlock: Number(log.blockNumber || 0),
          };
          existing.owned = false;
          existing.lastBlock = Number(log.blockNumber || 0);
          erc721State.set(key, existing);
        }

        const apply1155Delta = (log: any, sign: 1n | -1n) => {
          try {
            const parsed = ERC1155_TRANSFER_INTERFACE.parseLog({ topics: log.topics, data: log.data });
            if (!parsed || !ethers.isAddress(log.address)) return;

            if (parsed.name === 'TransferSingle') {
              const tokenId = parsed.args.id.toString();
              const value = BigInt(parsed.args.value.toString()) * sign;
              const key = `${log.address.toLowerCase()}:${tokenId}`;
              const existing = erc1155State.get(key) || {
                candidate: {
                  contractAddress: log.address,
                  tokenId,
                  type: 'ERC1155' as const,
                  blockNumber: Number(log.blockNumber || 0),
                },
                balance: 0n,
                lastBlock: Number(log.blockNumber || 0),
              };
              existing.balance += value;
              existing.lastBlock = Number(log.blockNumber || 0);
              erc1155State.set(key, existing);
              return;
            }

            if (parsed.name === 'TransferBatch') {
              const ids = Array.from((parsed.args as any).ids || []) as bigint[];
              const values = Array.from((parsed.args as any).values || []) as bigint[];
              const len = Math.min(ids.length, values.length);
              for (let i = 0; i < len; i += 1) {
                const tokenId = ids[i].toString();
                const value = BigInt(values[i].toString()) * sign;
                const key = `${log.address.toLowerCase()}:${tokenId}`;
                const existing = erc1155State.get(key) || {
                  candidate: {
                    contractAddress: log.address,
                    tokenId,
                    type: 'ERC1155' as const,
                    blockNumber: Number(log.blockNumber || 0),
                  },
                  balance: 0n,
                  lastBlock: Number(log.blockNumber || 0),
                };
                existing.balance += value;
                existing.lastBlock = Number(log.blockNumber || 0);
                erc1155State.set(key, existing);
              }
            }
          } catch {
            // ignore malformed logs
          }
        };

        inSingle.forEach((log) => apply1155Delta(log, 1n));
        outSingle.forEach((log) => apply1155Delta(log, -1n));
        inBatch.forEach((log) => apply1155Delta(log, 1n));
        outBatch.forEach((log) => apply1155Delta(log, -1n));
      }

      const candidates: NFTCandidate[] = [];
      erc721State.forEach((state) => {
        if (!state.owned) return;
        candidates.push({ ...state.candidate, blockNumber: state.lastBlock });
      });
      erc1155State.forEach((state) => {
        if (state.balance <= 0n) return;
        candidates.push({ ...state.candidate, blockNumber: state.lastBlock });
      });

      return candidates
        .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))
        .slice(0, maxCandidates);
    } catch (error) {
      console.error('Error scanning NFT transfer logs:', error);
      return [];
    }
  }

  private async getLogsSafe(provider: ethers.JsonRpcProvider, filter: any): Promise<any[]> {
    try {
      return await provider.getLogs(filter);
    } catch (error) {
      const from = Number(filter.fromBlock || 0);
      const to = Number(filter.toBlock || 0);
      if (!Number.isFinite(from) || !Number.isFinite(to) || to - from <= 500) {
        return [];
      }
      const mid = Math.floor((from + to) / 2);
      const left = await this.getLogsSafe(provider, { ...filter, fromBlock: from, toBlock: mid });
      const right = await this.getLogsSafe(provider, { ...filter, fromBlock: mid + 1, toBlock: to });
      return [...left, ...right];
    }
  }

  private async getOwnedTokenIdsFromLogs(
    ownerAddress: string,
    contractAddress: string,
    chainId: number,
    maxTokens: number
  ): Promise<string[]> {
    try {
      const provider = await this.getProvider(chainId);
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
    const provider = await this.getProvider(chainId);
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
    chainId: number,
    typeHint?: 'ERC721' | 'ERC1155',
    nameHint?: string
  ): Promise<NFT | null> {
    try {
      const provider = await this.getProvider(chainId);
      const erc721 = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      const erc1155 = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
      let tokenURI = '';
      let collectionName = nameHint || 'Unknown Collection';
      let type: 'ERC721' | 'ERC1155' = typeHint || 'ERC721';
      let metadata: any = {};

      const tryLoadErc721 = async () => {
        try {
          const collection = await erc721.name();
          if (collection) {
            collectionName = collection;
          }
        } catch {
          // ignore missing name()
        }
        try {
          tokenURI = await erc721.tokenURI(tokenId);
          metadata = await this.fetchNFTMetadata(this.resolveTokenURI(tokenURI, tokenId));
          type = 'ERC721';
          return true;
        } catch {
          return false;
        }
      };

      const tryLoadErc1155 = async () => {
        try {
          tokenURI = await erc1155.uri(tokenId);
          metadata = await this.fetchNFTMetadata(this.resolveTokenURI(tokenURI, tokenId));
          type = 'ERC1155';
          return true;
        } catch {
          return false;
        }
      };

      if (typeHint === 'ERC1155') {
        const ok = await tryLoadErc1155();
        if (!ok) {
          await tryLoadErc721();
        }
      } else if (typeHint === 'ERC721') {
        const ok = await tryLoadErc721();
        if (!ok) {
          await tryLoadErc1155();
        }
      } else {
        const ok = await tryLoadErc721();
        if (!ok) {
          await tryLoadErc1155();
        }
      }

      return {
        tokenId,
        contractAddress,
        name: metadata?.name || nameHint || `#${tokenId}`,
        description: metadata?.description || '',
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
      const provider = await this.getProvider(chainId);
      const erc721 = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      const owner = await erc721.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      try {
        const provider = await this.getProvider(chainId);
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
