import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WalletService from '../services/WalletService';
import NFTService, { NFT } from '../services/NFTService';
import { useLanguage } from '../i18n/LanguageContext';
import NFTMedia from '../components/NFTMedia';
import { normalizeNftUrl } from '../utils/nftMedia';

export default function NFTScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const loadSeq = useRef(0);

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

  const loadNfts = useCallback(async (options: { forceRefresh?: boolean; showSpinner?: boolean } = {}) => {
    const seq = ++loadSeq.current;
    const forceRefresh = options.forceRefresh === true;
    const showSpinner = options.showSpinner !== false;

    if (showSpinner) setLoading(true);
    try {
      const address = await WalletService.getAddress();
      const network = WalletService.getCurrentNetwork();
      if (seq !== loadSeq.current) return;

      if (!address) {
        setNfts([]);
      } else {
        const cached = await NFTService.getCachedUserNFTs(address, network.chainId);
        if (seq !== loadSeq.current) return;
        const safeCached = sanitizeNftList(cached, network.chainId);
        if (safeCached.length > 0) {
          setNfts(safeCached);
          // Render cached results immediately; refresh runs in background.
          if (showSpinner) setLoading(false);
        }

        const shouldRefresh = forceRefresh || safeCached.length === 0;
        if (!shouldRefresh) return;

        const live = await NFTService.refreshUserNFTs(address, network.chainId, { mode: forceRefresh ? 'full' : 'fast' });
        if (seq !== loadSeq.current) return;
        setNfts(sanitizeNftList(live, network.chainId));
      }
    } finally {
      if (seq === loadSeq.current && showSpinner) setLoading(false);
    }
  }, [sanitizeNftList]);

  useFocusEffect(
    useCallback(() => {
      let stopWatch: (() => void) | null = null;
      let cancelled = false;

      loadNfts({ forceRefresh: false, showSpinner: true }).catch(() => undefined);

      (async () => {
        const address = await WalletService.getAddress();
        const network = WalletService.getCurrentNetwork();
        if (cancelled || !address) return;

        stopWatch = NFTService.watchNFTTransfers(address, network.chainId, () => {
          loadNfts({ forceRefresh: true, showSpinner: false }).catch(() => undefined);
        });
      })();

      return () => {
        cancelled = true;
        if (stopWatch) stopWatch();
      };
    }, [loadNfts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNfts({ forceRefresh: true, showSpinner: false });
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: NFT }) => {
    const imageUri = normalizeNftUrl((item as any)?.image);
    const safeName =
      typeof item?.name === 'string' && item.name.trim()
        ? item.name
        : t.nft.unknownCollection;
    const safeCollection =
      typeof item?.collection === 'string' && item.collection.trim()
        ? item.collection
        : '-';
    const safeTokenId =
      typeof item?.tokenId === 'string' || typeof item?.tokenId === 'number' || typeof item?.tokenId === 'bigint'
        ? String(item.tokenId)
        : '-';
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NFTDetail', { nft: item })}>
        <NFTMedia uri={imageUri} imageStyle={styles.image} fallbackStyle={styles.imageFallback} />
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>{safeName}</Text>
          <Text style={styles.sub} numberOfLines={1}>{safeCollection}</Text>
          <Text style={styles.sub}>#{safeTokenId}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isTabScreen ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{t.common.back}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={styles.title}>{t.nft.myNFTs}</Text>
        <TouchableOpacity onPress={() => loadNfts({ forceRefresh: true, showSpinner: true }).catch(() => undefined)}>
          <Text style={styles.refresh}>{t.common.refresh}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#E9B949" />
        </View>
      ) : (
        <FlatList
          data={nfts}
          keyExtractor={(item) => `${item.contractAddress}-${item.tokenId}`}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={7}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E9B949" />}
          ListEmptyComponent={<Text style={styles.empty}>{t.nft.noNFTs}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1014' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
  },
  back: { color: '#E9B949', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  refresh: { color: '#E9B949', fontSize: 14, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#1A1D29',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E3550',
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#252A3D',
  },
  imageFallback: {
    width: '100%',
    height: 150,
    backgroundColor: '#252A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: '#9FA7BE',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 10,
  },
  name: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sub: { color: '#9FA7BE', fontSize: 11, marginTop: 2 },
  empty: {
    marginTop: 30,
    textAlign: 'center',
    color: '#9FA7BE',
    fontSize: 13,
  },
});
