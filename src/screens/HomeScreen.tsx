/**
 * Eagle Wallet - Home Screen
 * Main dashboard showing balance and tokens
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WalletService from '../services/WalletService';
import MultiWalletService from '../services/MultiWalletService';
import TokenLogoService from '../services/TokenLogoService';
import PriceService from '../services/PriceService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../i18n/LanguageContext';
import { getChainTokens } from '../config/tokenConfig';
import NFTService, { NFT } from '../services/NFTService';
import CustomTokenService from '../services/CustomTokenService';
import TokenVisibilityService from '../services/TokenVisibilityService';
import TokenBalanceCacheService from '../services/TokenBalanceCacheService';
import { ethers } from 'ethers';
import NFTMedia from '../components/NFTMedia';
import { normalizeNftUrl } from '../utils/nftMedia';
import AppEventBus, { EVENT_BALANCES_REFRESH } from '../services/AppEventBus';

const { width } = Dimensions.get('window');
const POPULAR_SYMBOLS = ['BNB', 'USDT', 'USDC', 'BUSD', 'BTCB', 'BTC', 'ETH', 'EAGLE'];

export default function HomeScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [balance, setBalance] = useState('0.0000');
  const [totalValue, setTotalValue] = useState('0.00');
  const [address, setAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nftLoading, setNftLoading] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [activeTab, setActiveTab] = useState<'crypto' | 'nft'>('crypto');
  const [hiddenTokenKeys, setHiddenTokenKeys] = useState<string[]>([]);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadSeq = useRef(0);
  const nftLoadSeq = useRef(0);
  const activeTabRef = useRef(activeTab);
  const addressRef = useRef('');
  const balanceRef = useRef(balance);
  const tokensRef = useRef<any[]>([]);
  const loadDataRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});
  const currentChainId = WalletService.getCurrentNetwork().chainId;
  const lastChainIdRef = useRef<number>(currentChainId);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const sanitizeNft = useCallback((raw: any, fallbackChainId: number): NFT | null => {
    if (!raw || typeof raw !== 'object') return null;
    const contractAddress = typeof raw.contractAddress === 'string' ? raw.contractAddress.trim() : '';
    const tokenId =
      typeof raw.tokenId === 'string' || typeof raw.tokenId === 'number' || typeof raw.tokenId === 'bigint'
        ? String(raw.tokenId)
        : '';
    if (!contractAddress || !tokenId) return null;
    return {
      tokenId,
      contractAddress,
      name: typeof raw.name === 'string' ? raw.name : '',
      description: typeof raw.description === 'string' ? raw.description : '',
      image: typeof raw.image === 'string' ? raw.image : '',
      collection: typeof raw.collection === 'string' ? raw.collection : '',
      chainId: Number(raw.chainId || fallbackChainId),
      type: raw.type === 'ERC1155' ? 'ERC1155' : 'ERC721',
      amount: typeof raw.amount === 'number' ? raw.amount : undefined,
    };
  }, []);

  const sanitizeNftList = useCallback(
    (rawList: any, fallbackChainId: number): NFT[] => {
      return Array.isArray(rawList)
        ? rawList.map((nft) => sanitizeNft(nft, fallbackChainId)).filter((nft): nft is NFT => !!nft)
        : [];
    },
    [sanitizeNft]
  );

  const loadNftsCacheFirst = useCallback(
    async (options: { forceRefresh?: boolean; showSpinner?: boolean } = {}) => {
      const owner = String(address || '').trim();
      const chainId = currentChainId;
      const forceRefresh = options.forceRefresh === true;
      const showSpinner = options.showSpinner === true;
      const seq = ++nftLoadSeq.current;

      if (!owner) {
        if (seq === nftLoadSeq.current) {
          setNfts([]);
          setNftLoading(false);
        }
        return;
      }

      try {
        const cached = await NFTService.getCachedUserNFTs(owner, chainId);
        if (seq !== nftLoadSeq.current) return;
        const safeCached = sanitizeNftList(cached, chainId);
        if (safeCached.length > 0) {
          setNfts(safeCached);
        }

        const shouldRefresh = forceRefresh || safeCached.length === 0;
        if (!shouldRefresh) {
          if (showSpinner) setNftLoading(false);
          return;
        }

        if (showSpinner) setNftLoading(true);
        const live = await NFTService.refreshUserNFTs(owner, chainId, { mode: forceRefresh ? 'full' : 'fast' });
        if (seq !== nftLoadSeq.current) return;
        setNfts(sanitizeNftList(live, chainId));
      } catch (error) {
        console.error('Error loading NFTs (cache-first):', error);
      } finally {
        if (seq === nftLoadSeq.current && showSpinner) {
          setNftLoading(false);
        }
      }
    },
    [address, currentChainId, sanitizeNftList]
  );
  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((resolve) => {
          timeoutId = setTimeout(() => resolve(fallback), ms);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  const loadData = async (options: { silent?: boolean } = {}) => {
    const silent = options.silent ?? false;
    if (loadingRef.current) return;
    loadingRef.current = true;
    const seq = ++loadSeq.current;
    const hadTokens = tokensRef.current.length > 0;
    const showLoading = !silent && !hadTokens;
    if (showLoading) setLoading(true);
    try {
      const currentNet = WalletService.getCurrentNetwork();
      const chainChanged = lastChainIdRef.current !== currentNet.chainId;
      if (chainChanged) lastChainIdRef.current = currentNet.chainId;
      const chainTokens = getChainTokens(currentNet.chainId);

      const toFixed4 = (value: string) => {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(4) : '0.0000';
      };

      const applyPriceData = (
        tokenList: any[],
        priceData: Record<string, { price: number; change24h: number; imageUrl?: string }>
      ) => {
        let total = 0;
        const pricedTokens = tokenList.map((token) => {
          const key = String(token.address || '').toLowerCase();
          const data = priceData[key] || { price: 0, change24h: 0 };
          const value = parseFloat(token.balance || '0') * (data.price || 0);
          total += value;
          return {
            ...token,
            price: data.price || 0,
            change: data.change24h || 0,
            value: value.toFixed(2),
            logo: data.imageUrl || token.logo,
          };
        });
        return { pricedTokens, total };
      };

      const mergeTokenLists = (prevList: any[], nextList: any[]) => {
        const prevMap = new Map<string, any>();
        prevList.forEach((token) => {
          const key = String(token.address || '').toLowerCase();
          if (!key) return;
          prevMap.set(key, token);
        });

        return nextList.map((token) => {
          const key = String(token.address || '').toLowerCase();
          const prev = key ? prevMap.get(key) : undefined;
          if (!prev) return token;
          return {
            ...token,
            balance: typeof prev.balance === 'string' ? prev.balance : token.balance,
            price: typeof prev.price === 'number' ? prev.price : token.price,
            change: typeof prev.change === 'number' ? prev.change : token.change,
            value: typeof prev.value === 'string' ? prev.value : token.value,
            logo: prev.logo || token.logo,
          };
        });
      };

      const recalcValues = (tokenList: any[]) => {
        let total = 0;
        const next = tokenList.map((token) => {
          const price = Number(token.price || 0);
          const balanceNum = parseFloat(token.balance || '0');
          const value = Number.isFinite(price) && Number.isFinite(balanceNum) ? balanceNum * price : 0;
          total += value;
          return { ...token, value: value.toFixed(2) };
        });
        return { pricedTokens: next, total };
      };

      // Render predefined tokens immediately (no async storage / no RPC).
      const tentativeNativeBalance =
        addressRef.current && !chainChanged ? toFixed4(balanceRef.current) : '0.0000';
      const baseTokenList: any[] = [
        {
          symbol: currentNet.symbol,
          name: currentNet.name,
          balance: tentativeNativeBalance,
          price: 0,
          change: 0,
          address: 'native',
          logo: currentNet.symbol.toLowerCase(),
        },
        ...chainTokens.map((token) => ({
          symbol: token.symbol,
          name: token.name,
          balance: '0.0000',
          price: 0,
          change: 0,
          address: token.address,
          logo: token.logo || token.symbol.toLowerCase(),
          color: token.color,
          decimals: token.decimals,
        })),
      ];

      const shouldPrimeTokenList = !hadTokens || chainChanged;
      if (shouldPrimeTokenList) {
        setTokens(baseTokenList);
      }
      if (showLoading) setLoading(false);

      const baseTokenAddresses = baseTokenList.map((t) => t.address);
      const cachedBasePricesPromise = PriceService.getCachedTokenPricesWithChange(
        baseTokenAddresses,
        currentNet.chainId
      ).catch(() => ({} as any));

      // Address read: prefer in-memory ref when available (fast), fall back to storage otherwise.
      const addrPromise = addressRef.current ? Promise.resolve(addressRef.current) : WalletService.getAddress();

      // Wallet list is only needed for UI label; skip on silent refresh to reduce work.
      const walletsPromise = silent ? Promise.resolve([] as any[]) : MultiWalletService.getAllWallets();

      // Local preferences (hidden tokens + custom tokens) should not block initial render.
      const hiddenPromise = silent ? Promise.resolve([] as string[]) : TokenVisibilityService.getHiddenTokens(currentNet.chainId);
      const customTokensPromise = silent ? Promise.resolve([] as any[]) : CustomTokenService.getCustomTokensByChain(currentNet.chainId);

      // Apply cached prices ASAP (do not wait for address).
      const cachedBasePriceData = await cachedBasePricesPromise;
      if (seq !== loadSeq.current) return;
      if (cachedBasePriceData && Object.keys(cachedBasePriceData).length > 0) {
        const quick = applyPriceData(tokensRef.current.length > 0 ? tokensRef.current : baseTokenList, cachedBasePriceData);
        setTokens(quick.pricedTokens);
        setTotalValue(quick.total.toFixed(2));
      }

      // Hidden token keys (affects filtering only).
      const hidden = await hiddenPromise;
      if (seq !== loadSeq.current) return;
      if (!silent) setHiddenTokenKeys(hidden);

      // Build final token list (predefined + custom) and preserve any cached prices already applied.
      let currentTokenList: any[] = baseTokenList;
      const customTokensRaw = await customTokensPromise;
      if (seq !== loadSeq.current) return;
      if (!silent) {
        const customTokens = (customTokensRaw || [])
          .filter((token: any) => token?.type === 'ERC20')
          .map((token: any) => ({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            decimals: token.decimals,
            logo: token.logo || String(token.symbol || '').toLowerCase(),
            color: '#4C6FFF',
            isCustom: true,
          }));

        const mergedTokensMap = new Map<string, any>();
        [...chainTokens, ...customTokens].forEach((token) => {
          const key = String(token.address || '').toLowerCase();
          if (!key) return;
          if (!mergedTokensMap.has(key)) mergedTokensMap.set(key, token);
        });
        const mergedTokens = Array.from(mergedTokensMap.values());

        const nextTokenList: any[] = [
          { ...baseTokenList[0] },
          ...mergedTokens.map((token) => ({
            symbol: token.symbol,
            name: token.name,
            balance: '0.0000',
            price: 0,
            change: 0,
            address: token.address,
            logo: token.logo || String(token.symbol || '').toLowerCase(),
            color: token.color,
            decimals: token.decimals,
          })),
        ];

        currentTokenList = mergeTokenLists(tokensRef.current.length > 0 ? tokensRef.current : baseTokenList, nextTokenList);
        setTokens(currentTokenList);

        const cachedFullPriceData = await PriceService.getCachedTokenPricesWithChange(
          currentTokenList.map((t) => t.address),
          currentNet.chainId
        ).catch(() => ({} as any));
        if (seq !== loadSeq.current) return;
        if (cachedFullPriceData && Object.keys(cachedFullPriceData).length > 0) {
          const quick = applyPriceData(currentTokenList, cachedFullPriceData);
          currentTokenList = quick.pricedTokens;
          setTokens(currentTokenList);
          setTotalValue(quick.total.toFixed(2));
        }
      } else if (tokensRef.current.length > 0 && !chainChanged) {
        // Silent refresh should not reset UI; keep the current list.
        currentTokenList = tokensRef.current;
      }

      const [addr, wallets] = await Promise.all([addrPromise, walletsPromise]);
      if (seq !== loadSeq.current) return;

      const prevAddr = String(addressRef.current || '').toLowerCase();
      const nextAddr = String(addr || '').toLowerCase();
      const isSameWallet = !!prevAddr && !!nextAddr && prevAddr === nextAddr;

      if (addr) {
        if (!silent || !addressRef.current) setAddress(addr);
        if (!silent) {
          const currentWallet = wallets.find((w) => w.address.toLowerCase() === addr.toLowerCase());
          if (currentWallet) setWalletName(currentWallet.name);
        }
      } else {
        if (!silent || addressRef.current) setAddress('');
        if (!silent) setWalletName('');
      }
      addressRef.current = addr || '';

      // If wallet changed, clear stale totals/balance and reset native display immediately.
      if (!isSameWallet) {
        balanceRef.current = '0.0000';
        setBalance('0.0000');
        setTotalValue('0.00');
        currentTokenList = [
          { ...currentTokenList[0], balance: '0.0000', value: '0.00' },
          ...currentTokenList.slice(1).map((t) => ({ ...t, balance: '0.0000', value: '0.00' })),
        ];
        setTokens(currentTokenList);
      }

      if (!addr) {
        setNfts([]);
        setNftLoading(false);
        setTotalValue('0.00');
        return;
      }

      // Apply cached balances ASAP (stale-while-revalidate).
      const cachedBalances = await TokenBalanceCacheService.getCachedBalances(currentNet.chainId, addr);
      if (seq !== loadSeq.current) return;
      if (cachedBalances) {
        const next = currentTokenList.map((token) => {
          const key = String(token.address || '').toLowerCase();
          const cached = cachedBalances[key];
          if (typeof cached === 'string' && cached.length > 0) {
            return { ...token, balance: cached };
          }
          return token;
        });

        const cachedNative = cachedBalances['native'];
        if (typeof cachedNative === 'string' && cachedNative.length > 0) {
          balanceRef.current = cachedNative;
          setBalance(cachedNative);
        }

        const recalced = recalcValues(next);
        currentTokenList = recalced.pricedTokens;
        setTokens(currentTokenList);
        setTotalValue(recalced.total.toFixed(2));
      }

      const updatedListWithBalances = [...currentTokenList];
      const tokenAddresses = updatedListWithBalances.map((t) => t.address);

      // Start provider init in parallel (may be slow on first run). Do not block initial render.
      const providerPromise = WalletService.getProvider().catch(() => null as any);

      const balancePromises = updatedListWithBalances.slice(1).map(async (token, index) => {
        try {
          if (!token?.address || token.address === 'native') return;
          const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
          const provider = await providerPromise;
          if (!provider) return;
          const contract = new ethers.Contract(token.address, erc20Abi, provider);
          const tokenBalance = await withTimeout(contract.balanceOf(addr), 2500, 0n as any);
          const balance = ethers.formatUnits(tokenBalance, token.decimals ?? 18);
          updatedListWithBalances[index + 1] = {
            ...updatedListWithBalances[index + 1],
            balance: parseFloat(balance).toFixed(4),
          };
        } catch {
          // ignore single token failures
        }
      });

      const nativeBalancePromise = (async () => {
        try {
          const provider = await providerPromise;
          if (!provider) return;
          const bn = await withTimeout(provider.getBalance(addr), 2500, 0n as any);
          const native = ethers.formatEther(bn);
          const fixed = Number.isFinite(Number(native)) ? parseFloat(native).toFixed(4) : '0.0000';
          balanceRef.current = fixed;
          setBalance(fixed);
          updatedListWithBalances[0] = { ...updatedListWithBalances[0], balance: fixed };
        } catch {
          // ignore native balance errors
        }
      })();

      const livePricePromise = withTimeout(
        PriceService.getTokenPricesWithChange(tokenAddresses, currentNet.chainId).catch(() => ({} as any)),
        2500,
        {} as any
      );

      const livePriceData = await livePricePromise;
      if (seq !== loadSeq.current) return;
      const hasLivePrice = Object.keys(livePriceData || {}).length > 0;
      if (hasLivePrice) {
        const quick = applyPriceData(updatedListWithBalances, livePriceData);
        setTokens(quick.pricedTokens);
        setTotalValue(quick.total.toFixed(2));
      }

      await Promise.all([nativeBalancePromise, ...balancePromises]);
      if (seq !== loadSeq.current) return;

      const priceDataForFinal = hasLivePrice ? livePriceData : ({} as any);
      const finalResult =
        hasLivePrice && Object.keys(livePriceData || {}).length > 0
          ? applyPriceData(updatedListWithBalances, livePriceData)
          : recalcValues(updatedListWithBalances);
      setTokens(finalResult.pricedTokens);
      setTotalValue(finalResult.total.toFixed(2));

      // Persist balances for next launch (cache-first UX).
      const balancesToCache: Record<string, string> = {};
      updatedListWithBalances.forEach((token) => {
        const key = String(token.address || '').toLowerCase();
        if (!key) return;
        balancesToCache[key] = String(token.balance || '0.0000');
      });
      await TokenBalanceCacheService.setCachedBalances(currentNet.chainId, addr, balancesToCache);
  } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      if (seq === loadSeq.current) {
        hasLoadedRef.current = true;
        if (showLoading) setLoading(false);
      }
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData({ silent: false });
      
      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        loadData({ silent: true });
      }, 30000);
      
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    const sub = AppEventBus.addListener(EVENT_BALANCES_REFRESH, () => {
      void loadDataRef.current({ silent: true });
    });
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    // Warm up cached NFTs in the background (stale-while-revalidate).
    void loadNftsCacheFirst({ forceRefresh: false, showSpinner: false });
  }, [address, currentChainId, loadNftsCacheFirst]);

  useEffect(() => {
    if (activeTab === 'nft') {
      void loadNftsCacheFirst({ forceRefresh: false, showSpinner: true });
    } else {
      setNftLoading(false);
    }
  }, [activeTab, loadNftsCacheFirst]);

  useEffect(() => {
    if (!address) return;
    return NFTService.watchNFTTransfers(address, currentChainId, () => {
      const showSpinner = activeTabRef.current === 'nft';
      void loadNftsCacheFirst({ forceRefresh: true, showSpinner });
    });
  }, [address, currentChainId, loadNftsCacheFirst]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);

    if (activeTabRef.current === 'nft') {
      loadNftsCacheFirst({ forceRefresh: true, showSpinner: true }).catch(() => undefined);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const displayTokens = useMemo(() => {
    const hiddenSet = new Set(hiddenTokenKeys.map((key) => key.toLowerCase()));
    const isEagle = (token: any) => String(token.symbol || '').toUpperCase() === 'EAGLE';
    const isHidden = (token: any) => {
      if (isEagle(token)) return false;
      const key = TokenVisibilityService.getTokenKey(token);
      return key ? hiddenSet.has(key.toLowerCase()) : false;
    };

    const rank = (symbol?: string) => {
      if (!symbol) return Number.MAX_SAFE_INTEGER;
      const idx = POPULAR_SYMBOLS.indexOf(symbol.toUpperCase());
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };

    return [...tokens]
      .filter((token) => !isHidden(token))
      .sort((a, b) => {
      const aIsEagle = isEagle(a);
      const bIsEagle = isEagle(b);
      if (aIsEagle !== bIsEagle) return aIsEagle ? -1 : 1;

      const ar = rank(a.symbol);
      const br = rank(b.symbol);
      if (ar !== br) return ar - br;

      const av = Number(a.value || 0);
      const bv = Number(b.value || 0);
      if (Number.isFinite(av) && Number.isFinite(bv) && av !== bv) {
        return bv - av;
      }

      return String(a.symbol || '').localeCompare(String(b.symbol || ''));
    });
  }, [tokens, hiddenTokenKeys]);

  const renderTokenItem = useCallback(({ item }: { item: any }) => {
    let logoSource = null;
    if (item.logo && item.logo.startsWith('http')) {
      logoSource = { uri: item.logo };
    } else {
      logoSource = TokenLogoService.getTokenLogo(item.logo || item.symbol);
    }

    return (
      <TouchableOpacity
        style={styles.tokenItem}
        onPress={() => navigation.navigate('TokenDetail', { token: item })}
      >
        {logoSource ? (
          <Image source={logoSource} style={styles.tokenLogoImage} />
        ) : (
          <View style={[styles.tokenIcon, { backgroundColor: item.color || '#333' }]}>
            <Text style={styles.tokenIconText}>{item.symbol?.[0]}</Text>
          </View>
        )}

        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.tokenPrice,
                { color: item.price > 0 ? '#21D185' : '#999' },
              ]}
            >
              ${item.price > 0 ? (item.price < 0.01 ? item.price.toFixed(6) : item.price.toFixed(2)) : '0.00'}
            </Text>
          </View>
        </View>
        <View style={styles.tokenRight}>
          <Text style={styles.tokenBalanceAmount}>{item.balance}</Text>
          <Text style={styles.tokenValueSmall}>
            ${item.value && parseFloat(item.value) > 0 ? item.value : '0.00'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderNftItem = useCallback(({ item }: { item: NFT }) => {
    const imageUri = normalizeNftUrl((item as any)?.image);
    const safeName =
      typeof item?.name === 'string' && item.name.trim()
        ? item.name
        : t.nft.unknownCollection;
    const safeTokenId =
      typeof item?.tokenId === 'string' || typeof item?.tokenId === 'number' || typeof item?.tokenId === 'bigint'
        ? String(item.tokenId)
        : '-';
    return (
      <TouchableOpacity
        style={styles.nftCard}
        onPress={() => navigation.navigate('NFTDetail', { nft: item })}
      >
        <NFTMedia uri={imageUri} imageStyle={styles.nftImage} fallbackStyle={styles.nftImageFallback} />
        <View style={styles.nftInfo}>
          <Text style={styles.nftName} numberOfLines={1}>{safeName}</Text>
          <Text style={styles.nftId}>#{safeTokenId}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation, t.nft.unknownCollection]);

  const nftCollections = useMemo(() => {
    const grouped = new Map<string, { key: string; name: string; count: number; image: string; first: NFT }>();
    for (const nft of nfts) {
      if (!nft || !nft.contractAddress) continue;
      const key = `${String(nft.contractAddress).toLowerCase()}-${String(nft.type || 'ERC721')}`;
      const name =
        typeof nft.name === 'string' && nft.name.trim()
          ? nft.name
          : (typeof nft.collection === 'string' && nft.collection.trim() ? nft.collection : t.nft.unknownCollection);
      const image = normalizeNftUrl((nft as any)?.image);
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.image && image) {
          existing.image = image;
        }
      } else {
        grouped.set(key, {
          key,
          name,
          count: 1,
          image,
          first: nft,
        });
      }
    }
    return Array.from(grouped.values());
  }, [nfts, t.nft.unknownCollection]);

  const renderNftCollectionItem = useCallback(({ item }: { item: { key: string; name: string; count: number; image: string; first: NFT } }) => {
    return (
      <TouchableOpacity
        style={styles.nftCollectionItem}
        onPress={() => navigation.navigate('NFTDetail', { nft: item.first })}
      >
        <NFTMedia
          uri={item.image}
          imageStyle={styles.nftCollectionImage}
          fallbackStyle={styles.nftCollectionFallback}
          fallbackIconSize={20}
          fallbackIconColor="#777"
        />
        <Text style={styles.nftCollectionName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.nftCollectionCount}>{item.count}</Text>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.walletSelector}
          onPress={() => navigation.navigate('Wallets')}
        >
          <View style={styles.walletIcon} />
          <Text style={styles.walletName}>{walletName || t.home.myWallet}</Text>
          <Icon name="chevron-down" size={16} color="#999" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          {!isTabScreen && (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('DAppBrowser')}>
                <Icon name="web" size={20} color="#999" style={styles.iconButton} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Icon name="cog" size={20} color="#999" style={styles.iconButton} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

            <View style={styles.topContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.home.totalBalance}</Text>
          <Text style={styles.balanceValue}>{`~ $${totalValue}`}</Text>
          <TouchableOpacity
            style={styles.addressContainer}
            onPress={() => navigation.navigate('Receive')}
          >
            <Text style={styles.addressText}>{formatAddress(address)}</Text>
            <Icon name="content-copy" size={12} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Send')}>
            <View style={styles.actionIconContainer}>
              <Icon name="arrow-up" size={22} color="#000" />
            </View>
            <Text style={styles.actionLabel}>{t.home.send}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Receive')}>
            <View style={styles.actionIconContainer}>
              <Icon name="arrow-down" size={22} color="#000" />
            </View>
            <Text style={styles.actionLabel}>{t.home.receive}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Swap')}>
            <View style={styles.actionIconContainer}>
              <Icon name="swap-horizontal" size={22} color="#000" />
            </View>
            <Text style={styles.actionLabel}>{t.home.swap}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TransactionHistory')}>
            <View style={styles.actionIconContainer}>
              <Icon name="history" size={22} color="#000" />
            </View>
            <Text style={styles.actionLabel}>{t.home.activity}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tokensContainer}>
        <View style={styles.tabsHeader}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'crypto' && styles.activeTabButton]}
              onPress={() => setActiveTab('crypto')}
            >
              <Text style={[styles.tabText, activeTab === 'crypto' && styles.activeTabText]}>{t.home.tokens}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'nft' && styles.activeTabButton]}
              onPress={() => setActiveTab('nft')}
            >
              <Text style={[styles.tabText, activeTab === 'nft' && styles.activeTabText]}>{t.home.nft}</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'crypto' && (
            <TouchableOpacity onPress={() => navigation.navigate('AddToken')}>
              <Text style={styles.addTokenText}>+ {t.common.add}</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading && activeTab === 'crypto' && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#F3BA2F" />
            <Text style={styles.loadingText}>{t.common.loading}</Text>
          </View>
        )}

        {activeTab === 'crypto' ? (
          <FlatList
            data={displayTokens}
            keyExtractor={(item, index) => String(item.address) + '-' + index}
            renderItem={renderTokenItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3BA2F" />}
            contentContainerStyle={styles.tokenListContent}
            ListEmptyComponent={!loading ? <Text style={styles.emptyListText}>{t.home.noTokens}</Text> : null}
            ListFooterComponent={(
              <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('ManageTokens')}>
                <Text style={styles.manageButtonText}>{`${t.common.edit} ${t.token.tokens}`}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={nftCollections}
            keyExtractor={(item) => item.key}
            renderItem={renderNftCollectionItem}
            removeClippedSubviews
            initialNumToRender={6}
            windowSize={7}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3BA2F" />}
            contentContainerStyle={styles.tokenListContent}
            ListEmptyComponent={(
              nftLoading ? (
                <View style={styles.emptyNftState}>
                  <ActivityIndicator color="#F3BA2F" />
                  <Text style={styles.emptyNftText}>{t.common.loading}</Text>
                </View>
              ) : (
                <View style={styles.emptyNftState}>
                  <Icon name="image-outline" size={36} color="#666" />
                  <Text style={styles.emptyNftText}>{t.nft.noNFTs}</Text>
                </View>
              )
            )}
          />
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  walletIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3BA2F',
    marginRight: 8,
  },
  walletName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    fontSize: 20,
    marginLeft: 20,
  },
  topContent: {
    paddingBottom: 12,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  balanceLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  addressText: {
    color: '#999',
    fontSize: 12,
    marginRight: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3BA2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#F3BA2F',
    fontSize: 12,
    fontWeight: '500',
  },
  tokensContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flex: 1,
  },
  tabsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  addTokenText: {
    color: '#F3BA2F',
    fontSize: 14,
  },
  tokenListContent: {
    paddingBottom: 20,
  },
  nftRow: {
    justifyContent: 'space-between',
  },
  nftCollectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  nftCollectionImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#252A3D',
  },
  nftCollectionFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#252A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nftCollectionName: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  nftCollectionCount: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  nftListContent: {
    paddingBottom: 20,
  },
  nftCard: {
    width: (width - 60) / 2,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  nftImage: {
    width: '100%',
    height: (width - 60) / 2,
    backgroundColor: '#333',
  },
  nftImageFallback: {
    width: '100%',
    height: (width - 60) / 2,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nftInfo: {
    padding: 10,
  },
  nftName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nftId: {
    color: '#999',
    fontSize: 12,
  },
  emptyNftState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNftText: {
    color: '#999',
    fontSize: 14,
  },
  emptyListText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tokenLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  tokenIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBalanceAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tokenPrice: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  tokenChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  tokenValueSmall: {
    color: '#999',
    fontSize: 13,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  loadingText: {
    color: '#999',
    marginLeft: 8,
    fontSize: 12,
  },
  manageButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
  },
  manageButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
