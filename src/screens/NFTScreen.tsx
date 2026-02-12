import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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

export default function NFTScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);

  const loadNfts = useCallback(async () => {
    setLoading(true);
    try {
      const address = await WalletService.getAddress();
      const network = WalletService.getCurrentNetwork();

      if (!address) {
        setNfts([]);
      } else {
        const data = await NFTService.getUserNFTs(address, network.chainId);
        setNfts(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNfts();
    }, [loadNfts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNfts();
    setRefreshing(false);
  };

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

  const renderItem = ({ item }: { item: NFT }) => {
    const imageUri = normalizeNftImage((item as any)?.image);
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NFTDetail', { nft: item })}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>NFT</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>{item.name || t.nft.unknownCollection}</Text>
          <Text style={styles.sub} numberOfLines={1}>{item.collection || '-'}</Text>
          <Text style={styles.sub}>#{item.tokenId || '-'}</Text>
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
        <TouchableOpacity onPress={loadNfts}>
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
