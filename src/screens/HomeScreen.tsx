/**
 * Eagle Wallet - Home Screen
 * Main dashboard showing balance and tokens
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import { ethers } from 'ethers';

const { width } = Dimensions.get('window');
const POPULAR_SYMBOLS = ['BNB', 'USDT', 'USDC', 'BUSD', 'BTCB', 'BTC', 'ETH', 'EAGLE'];

export default function HomeScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [balance, setBalance] = useState('0.0000');
  const [totalValue, setTotalValue] = useState('0.00');
  const [address, setAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [activeTab, setActiveTab] = useState<'crypto' | 'nft'>('crypto');
  const loadingRef = useRef(false);
  const loadSeq = useRef(0);

  const loadData = async (options: { silent?: boolean } = {}) => {
    const silent = options.silent ?? false;
    if (loadingRef.current) return;
    loadingRef.current = true;
    const showLoading = !silent || !hasLoaded;
    if (showLoading) setLoading(true);
    const seq = ++loadSeq.current;
    try {
      const [addr, wallets, bal] = await Promise.all([
        WalletService.getAddress(),
        MultiWalletService.getAllWallets(),
        WalletService.getBalance(),
      ]);
      if (seq !== loadSeq.current) return;

      if (addr) {
        setAddress(addr);
        const currentWallet = wallets.find(w => w.address.toLowerCase() === addr.toLowerCase());
        if (currentWallet) {
          setWalletName(currentWallet.name);
        }
      } else {
        setAddress('');
        setWalletName('');
      }

      const parsedBal = Number(bal);
      const formattedBal = Number.isFinite(parsedBal) ? parsedBal.toFixed(4) : '0.0000';
      setBalance(formattedBal);

      const currentNet = WalletService.getCurrentNetwork();
      const chainTokens = getChainTokens(currentNet.chainId);

      // Show predefined tokens immediately (even before balances/custom tokens load)
      const baseTokenList: any[] = [
        {
          symbol: currentNet.symbol,
          name: currentNet.name,
          balance: formattedBal,
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
      setTokens(baseTokenList);

      if (!addr) {
        setNfts([]);
        setTotalValue('0.00');
        return;
      }

      const [userNFTs, customTokensRaw] = await Promise.all([
        NFTService.getUserNFTs(addr, currentNet.chainId),
        CustomTokenService.getCustomTokensByChain(currentNet.chainId),
      ]);
      if (seq !== loadSeq.current) return;
      const safeNFTs = Array.isArray(userNFTs) ? userNFTs : [];
      setNfts(safeNFTs);
      const customTokens = customTokensRaw
        .filter((token) => token.type === 'ERC20')
        .map((token) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          decimals: token.decimals,
          logo: token.logo || token.symbol.toLowerCase(),
          color: '#4C6FFF',
          isCustom: true,
        }));

      // Deduplicate by contract address to avoid duplicate list entries
      const mergedTokensMap = new Map<string, any>();
      [...chainTokens, ...customTokens].forEach((token) => {
        const key = token.address.toLowerCase();
        if (!mergedTokensMap.has(key)) {
          mergedTokensMap.set(key, token);
        }
      });
      const mergedTokens = Array.from(mergedTokensMap.values());
      
      // Get provider for balance queries
      const provider = await WalletService.getProvider();
      
      // Build token list with native token first (including custom tokens)
      const initialTokenList: any[] = [
        {
          symbol: currentNet.symbol,
          name: currentNet.name,
          balance: formattedBal,
          price: 0,
          change: 0,
          address: 'native',
          logo: currentNet.symbol.toLowerCase(),
        },
        ...mergedTokens.map((token) => ({
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

      // Update list once custom tokens are ready
      setTokens(initialTokenList);

      const updatedListWithBalances = [...initialTokenList];
      const balancePromises = mergedTokens.map(async (token, index) => {
        try {
          const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
          const contract = new ethers.Contract(token.address, erc20Abi, provider);
          const tokenBalance = await contract.balanceOf(addr);
          const balance = ethers.formatUnits(tokenBalance, token.decimals);
          updatedListWithBalances[index + 1] = {
            ...updatedListWithBalances[index + 1],
            balance: parseFloat(balance).toFixed(4),
          };
        } catch {
          // ignore single token failures
        }
      });

      const tokenAddresses = updatedListWithBalances.map(t => t.address);
      const pricePromise = PriceService.getTokenPricesWithChange(tokenAddresses, currentNet.chainId)
        .catch(() => ({}));

      await Promise.all(balancePromises);
      const priceData = await pricePromise;
      if (seq !== loadSeq.current) return;

      let totalPortfolioValue = 0;
      const tokensWithPrices = updatedListWithBalances.map(token => {
        const data = priceData[token.address.toLowerCase()] || { price: 0, change24h: 0 };
        const value = parseFloat(token.balance) * data.price;
        
        totalPortfolioValue += value;

        // Use API logo if available, otherwise keep existing
        let logo = token.logo;
        // @ts-ignore
        if (data.imageUrl) {
            // @ts-ignore
            logo = data.imageUrl;
        }

        return {
          ...token,
          price: data.price,
          change: data.change24h,
          value: value.toFixed(2),
          logo: logo
        };
      });
      
      setTokens(tokensWithPrices);
      setTotalValue(totalPortfolioValue.toFixed(2));
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      if (seq === loadSeq.current) {
        setHasLoaded(true);
        if (showLoading) setLoading(false);
      }
      loadingRef.current = false;
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const displayTokens = useMemo(() => {
    const rank = (symbol?: string) => {
      if (!symbol) return Number.MAX_SAFE_INTEGER;
      const idx = POPULAR_SYMBOLS.indexOf(symbol.toUpperCase());
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };

    return [...tokens].sort((a, b) => {
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
  }, [tokens]);

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

  const normalizeNftImage = (raw: any) => {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('ipfs://ipfs/')) {
      return trimmed.replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/');
    }
    if (trimmed.startsWith('ipfs://')) {
      return trimmed.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    return '';
  };

  const renderNftItem = useCallback(({ item }: { item: NFT }) => {
    const imageUri = normalizeNftImage((item as any)?.image);
    return (
      <TouchableOpacity
        style={styles.nftCard}
        onPress={() => navigation.navigate('NFTDetail', { nft: item })}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.nftImage} resizeMode="cover" />
        ) : (
          <View style={styles.nftImageFallback}>
            <Icon name="image-outline" size={28} color="#666" />
          </View>
        )}
        <View style={styles.nftInfo}>
          <Text style={styles.nftName} numberOfLines={1}>{item.name || t.nft.unknownCollection}</Text>
          <Text style={styles.nftId}>#{item.tokenId || '-'}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation, t.nft.unknownCollection]);

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
          <Text style={styles.balanceValue}>{`≈ $${totalValue}`}</Text>
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
        {loading && (
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
              <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('AddToken')}>
                <Text style={styles.manageButtonText}>{t.home.manageAddWallets}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={nfts}
            keyExtractor={(item, index) => String(item.contractAddress || item.tokenId) + '-' + index}
            renderItem={renderNftItem}
            numColumns={2}
            columnWrapperStyle={styles.nftRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3BA2F" />}
            contentContainerStyle={styles.nftListContent}
            ListEmptyComponent={(
              <View style={styles.emptyNftState}>
                <Icon name="image-outline" size={36} color="#666" />
                <Text style={styles.emptyNftText}>{t.nft.noNFTs}</Text>
              </View>
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
