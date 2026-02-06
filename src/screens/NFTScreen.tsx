/**
 * Eagle Wallet - NFT Gallery Screen
 * Display user's NFT collection
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import NFTService, { NFT } from '../services/NFTService';
import WalletService from '../services/WalletService';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

export default function NFTScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const addr = await WalletService.getAddress();
      if (addr) {
        setAddress(addr);
        const network = WalletService.getCurrentNetwork();
        const userNFTs = await NFTService.getUserNFTs(addr, network.chainId);
        setNfts(userNFTs);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNFTs();
    setRefreshing(false);
  };

  const renderNFTItem = ({ item }: { item: NFT }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => navigation.navigate('NFTDetail', { nft: item })}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
        style={styles.nftImage}
        resizeMode="cover"
      />
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.nftCollection} numberOfLines={1}>
          {item.collection}
        </Text>
        <Text style={styles.nftId} numberOfLines={1}>
          #{item.tokenId}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F3BA2F" />
        <Text style={styles.loadingText}>Loading your NFTs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>â†?Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My NFTs</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* NFT Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* NFT Grid */}
      {nfts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>ðŸ–¼ï¸?/Text>
          <Text style={styles.emptyText}>No NFTs found</Text>
          <Text style={styles.emptySubtext}>
            Your NFTs will appear here automatically
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadNFTs}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={nfts}
          renderItem={renderNFTItem}
          keyExtractor={(item, index) => `${item.contractAddress}-${item.tokenId}-${index}`}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    fontSize: 16,
    color: '#F3BA2F',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  countContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  gridContainer: {
    padding: 20,
  },
  nftCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nftImage: {
    width: '100%',
    height: ITEM_WIDTH,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  nftCollection: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  nftId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
