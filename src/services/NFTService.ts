/**
 * Eagle Wallet - NFT Service
 * Automatically fetch and display user's NFTs
 */

import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';
import RPCService from './RPCService';
import { toIpfsGatewayCandidates, normalizeNftUrl } from '../utils/nftMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const NFT_CACHE_PREFIX = 'EAGLE_NFT_CACHE_V1:';
const NFT_TRANSFER_CURSOR_PREFIX = 'EAGLE_NFT_TRANSFER_CURSOR_V1:';
const TRANSFER_WATCH_POLL_MS = 15000;
const TRANSFER_WATCH_LOOKBACK_BLOCKS = 2000;
const TRANSFER_WATCH_SCAN_CHUNK = 2000;

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
  private refreshInFlight = new Map<string, Promise<NFT[]>>();
  private transferWatchers = new Map<
    string,
    {
      timer: ReturnType<typeof setInterval>;
      callbacks: Set<(event: { chainId: number; address: string; fromBlock: number; toBlock: number }) => void>;
      running: boolean;
      lastBlock: number;
    }
  >();

  private async mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const size = items.length;
    if (size === 0) return [];

    const resolvedLimit = Math.max(1, Math.min(limit, size));
    const results: R[] = new Array(size);
    let cursor = 0;

    const runners = Array.from({ length: resolvedLimit }, async () => {
      while (cursor < size) {
        const idx = cursor;
        cursor += 1;
        try {
          results[idx] = await worker(items[idx], idx);
        } catch {
          // @ts-expect-error - allow sparse failures
          results[idx] = undefined;
        }
      }
    });

    await Promise.all(runners);
    return results;
  }

  private cacheKey(chainId: number, address: string): string {
    return `${NFT_CACHE_PREFIX}${chainId}:${String(address || '').toLowerCase()}`;
  }

  private transferCursorKey(chainId: number, address: string): string {
    return `${NFT_TRANSFER_CURSOR_PREFIX}${chainId}:${String(address || '').toLowerCase()}`;
  }

  async getCachedUserNFTs(address: string, chainId: number): Promise<NFT[]> {
    try {
      const raw = await AsyncStorage.getItem(this.cacheKey(chainId, address));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { updatedAt: number; nfts: NFT[] };
      if (!parsed?.nfts || !Array.isArray(parsed.nfts)) return [];
      return parsed.nfts;
    } catch {
      return [];
    }
  }

  private async setCachedUserNFTs(address: string, chainId: number, nfts: NFT[]): Promise<void> {
    try {
      const payload = { updatedAt: Date.now(), nfts };
      await AsyncStorage.setItem(this.cacheKey(chainId, address), JSON.stringify(payload));
    } catch {
      // ignore cache write failures
    }
  }

  async refreshUserNFTs(
    address: string,
    chainId: number,
    options?: { mode?: 'fast' | 'full' }
  ): Promise<NFT[]> {
    const mode = options?.mode === 'full' ? 'full' : 'fast';
    const key = `${chainId}:${String(address || '').toLowerCase()}:${mode}`;
    const inFlight = this.refreshInFlight.get(key);
    if (inFlight) return inFlight;

    const task = this.getUserNFTs(address, chainId, { mode })
      .catch(() => [] as NFT[])
      .finally(() => {
        this.refreshInFlight.delete(key);
      });
    this.refreshInFlight.set(key, task);
    return task;
  }

  watchNFTTransfers(
    address: string,
    chainId: number,
    onTransfer: (event: { chainId: number; address: string; fromBlock: number; toBlock: number }) => void,
    options?: { pollMs?: number; lookbackBlocks?: number }
  ): () => void {
    const normalized = String(address || '').toLowerCase();
    const key = `${chainId}:${normalized}`;
    const pollMs = options?.pollMs ?? TRANSFER_WATCH_POLL_MS;
    const lookbackBlocks = options?.lookbackBlocks ?? TRANSFER_WATCH_LOOKBACK_BLOCKS;

    const existing = this.transferWatchers.get(key);
    if (existing) {
      existing.callbacks.add(onTransfer);
      return () => {
        this.unwatchNFTTransfers(chainId, normalized, onTransfer);
      };
    }

    const state = {
      timer: null as any,
      callbacks: new Set([onTransfer]),
      running: false,
      lastBlock: 0,
    };

    state.timer = setInterval(() => {
      this.pollTransferWatcher(chainId, normalized, lookbackBlocks).catch(() => undefined);
    }, pollMs);

    this.transferWatchers.set(key, state);

    // Kick once immediately
    this.pollTransferWatcher(chainId, normalized, lookbackBlocks).catch(() => undefined);

    return () => {
      this.unwatchNFTTransfers(chainId, normalized, onTransfer);
    };
  }

  private unwatchNFTTransfers(
    chainId: number,
    normalizedAddress: string,
    callback: (event: { chainId: number; address: string; fromBlock: number; toBlock: number }) => void
  ): void {
    const key = `${chainId}:${normalizedAddress}`;
    const existing = this.transferWatchers.get(key);
    if (!existing) return;
    existing.callbacks.delete(callback);
    if (existing.callbacks.size > 0) return;
    clearInterval(existing.timer);
    this.transferWatchers.delete(key);
  }

  private async pollTransferWatcher(chainId: number, normalizedAddress: string, lookbackBlocks: number): Promise<void> {
    const key = `${chainId}:${normalizedAddress}`;
    const watcher = this.transferWatchers.get(key);
    if (!watcher || watcher.running) return;
    watcher.running = true;

    try {
      const provider = await this.getProvider(chainId);
      const currentBlock = await provider.getBlockNumber();

      if (!watcher.lastBlock) {
        const stored = await AsyncStorage.getItem(this.transferCursorKey(chainId, normalizedAddress));
        const parsed = stored ? Number(stored) : 0;
        watcher.lastBlock = Number.isFinite(parsed) && parsed > 0 ? parsed : Math.max(0, currentBlock - lookbackBlocks);
      }

      const fromBlock = watcher.lastBlock + 1;
      if (fromBlock > currentBlock) {
        watcher.lastBlock = currentBlock;
        return;
      }

      let scanStart = fromBlock;
      let detected = false;
      let detectedFrom = fromBlock;
      let detectedTo = fromBlock;

      while (scanStart <= currentBlock) {
        const scanEnd = Math.min(currentBlock, scanStart + TRANSFER_WATCH_SCAN_CHUNK - 1);
        const hasTransfers = await this.hasNftTransfersInRange(
          provider,
          normalizedAddress,
          scanStart,
          scanEnd
        );

        watcher.lastBlock = scanEnd;
        await AsyncStorage.setItem(this.transferCursorKey(chainId, normalizedAddress), String(watcher.lastBlock));

        if (hasTransfers) {
          detected = true;
          detectedFrom = scanStart;
          detectedTo = scanEnd;
          break;
        }

        scanStart = scanEnd + 1;
      }

      if (detected) {
        watcher.callbacks.forEach((cb) => {
          try {
            cb({ chainId, address: normalizedAddress, fromBlock: detectedFrom, toBlock: detectedTo });
          } catch {
            // ignore callback errors
          }
        });
      }
    } finally {
      watcher.running = false;
    }
  }

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
  async getUserNFTs(address: string, chainId: number, options?: { mode?: 'fast' | 'full' }): Promise<NFT[]> {
    try {
      if (!ethers.isAddress(address)) {
        return [];
      }

      const mode = options?.mode === 'full' ? 'full' : 'fast';
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

      if (nftContracts.length > 0) {
        const results = await Promise.allSettled(
          nftContracts.map((contractAddress) => this.getNFTsFromContract(address, contractAddress, chainId))
        );
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            res.value.forEach(addNFT);
            return;
          }
          console.warn(`Error fetching NFTs from ${nftContracts[idx]}:`, res.reason);
        });
      }

      if (mode === 'full') {
        // Discovery path: scan on-chain transfer logs via the wallet RPC and verify ownership.
        // This can be slow on some public nodes, so keep it optional.
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
      }

      const result = Array.from(nftMap.values());
      // Persist a lightweight cache so the UI can render instantly (stale-while-revalidate).
      void this.setCachedUserNFTs(normalizedOwner, chainId, result);
      return result;
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
        const count = Math.min(balanceNum, MAX_NFTS_PER_CONTRACT);
        const indices = Array.from({ length: count }, (_, i) => i);
        const fetched = await this.mapWithConcurrency(indices, 4, async (index) => {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, index);
            const tokenIdStr = tokenId.toString();
            const metadata = await this.fetchMetadataFrom721Contract(contract, tokenIdStr);
            return {
              tokenId: tokenIdStr,
              contractAddress,
              name: metadata.name || `#${tokenIdStr}`,
              description: metadata.description || '',
              image: this.extractImage(metadata),
              collection: collectionName,
              chainId,
              type: 'ERC721' as const,
            } satisfies NFT;
          } catch {
            return null as any;
          }
        });

        return fetched.filter((item): item is NFT => !!item);
      }

      // Non-enumerable fallback: infer owned token IDs from Transfer logs
      const inferredTokenIds = await this.getOwnedTokenIdsFromLogs(
        ownerAddress,
        contractAddress,
        chainId,
        MAX_NFTS_PER_CONTRACT
      );

      const fetched = await this.mapWithConcurrency(inferredTokenIds, 4, async (tokenIdStr) => {
        try {
          const isOwned = await this.ownsNFT(ownerAddress, contractAddress, tokenIdStr, chainId);
          if (!isOwned) {
            return null as any;
          }

          const metadata = await this.fetchMetadataFrom721Contract(contract, tokenIdStr);

          return {
            tokenId: tokenIdStr,
            contractAddress,
            name: metadata.name || `#${tokenIdStr}`,
            description: metadata.description || '',
            image: this.extractImage(metadata),
            collection: collectionName,
            chainId,
            type: 'ERC721' as const,
          } satisfies NFT;
        } catch {
          return null as any;
        }
      });

      return fetched.filter((item): item is NFT => !!item);
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
    // Keep this list tight and correct; wrong addresses can cause very slow scans.
    const contracts: Record<number, string[]> = {
      // BSC Mainnet
      56: [
        // Eagle Access NFT (ERC-721)
        '0x3c117d186c5055071eff91d87f2600eaf88d591d',
        // Pancake Squad (ERC-721)
        '0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07',
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

        const [in721, out721, in1155, out1155] = await Promise.all([
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            // ERC-721 Transfer has 4 topics (tokenId is indexed). This excludes ERC-20 transfers (3 topics).
            topics: [TRANSFER_EVENT_TOPIC, null, ownerTopic, null],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [TRANSFER_EVENT_TOPIC, ownerTopic, null, null],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [[TRANSFER_SINGLE_EVENT_TOPIC, TRANSFER_BATCH_EVENT_TOPIC], null, null, ownerTopic],
          }),
          this.getLogsSafe(provider, {
            fromBlock: start,
            toBlock: end,
            topics: [[TRANSFER_SINGLE_EVENT_TOPIC, TRANSFER_BATCH_EVENT_TOPIC], null, ownerTopic, null],
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

        in1155.forEach((log) => apply1155Delta(log, 1n));
        out1155.forEach((log) => apply1155Delta(log, -1n));
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

  private async hasNftTransfersInRange(
    provider: ethers.JsonRpcProvider,
    normalizedAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<boolean> {
    try {
      const ownerTopic = ethers.zeroPadValue(ethers.getAddress(normalizedAddress), 32);
      const [in721, out721, in1155, out1155] = await Promise.all([
        this.getLogsSafe(provider, { fromBlock, toBlock, topics: [TRANSFER_EVENT_TOPIC, null, ownerTopic, null] }),
        this.getLogsSafe(provider, { fromBlock, toBlock, topics: [TRANSFER_EVENT_TOPIC, ownerTopic, null, null] }),
        this.getLogsSafe(provider, {
          fromBlock,
          toBlock,
          topics: [[TRANSFER_SINGLE_EVENT_TOPIC, TRANSFER_BATCH_EVENT_TOPIC], null, null, ownerTopic],
        }),
        this.getLogsSafe(provider, {
          fromBlock,
          toBlock,
          topics: [[TRANSFER_SINGLE_EVENT_TOPIC, TRANSFER_BATCH_EVENT_TOPIC], null, ownerTopic, null],
        }),
      ]);

      // Some nodes may still return ERC-20 logs on the 721 topic (rare). Keep a hard guard.
      const has721 = (logs: any[]) => Array.isArray(logs) && logs.some((l) => Array.isArray(l?.topics) && l.topics.length >= 4);
      return (
        has721(in721) ||
        has721(out721) ||
        (Array.isArray(in1155) && in1155.length > 0) ||
        (Array.isArray(out1155) && out1155.length > 0)
      );
    } catch {
      return false;
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
