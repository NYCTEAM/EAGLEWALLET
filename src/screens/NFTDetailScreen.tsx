/**
 * Eagle Wallet - NFT Detail Screen
 * Shows detailed NFT info, contract address, and transfer options
 * Similar to OKX / AlphaWallet design
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Clipboard,
  Alert,
  Dimensions,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import WalletService from '../services/WalletService';

const { width } = Dimensions.get('window');

export default function NFTDetailScreen({ route, navigation }: any) {
  const { nft } = route.params;
  const { t } = useLanguage();
  const network = WalletService.getCurrentNetwork();

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    Alert.alert(t.common.copied, t.receive.addressCopied);
  };

  const openMarketplace = () => {
    // Determine marketplace URL based on chain
    let url = '';
    if (nft.chainId === 56) {
      url = `https://element.market/assets/bsc/${nft.contractAddress}/${nft.tokenId}`;
    } else if (nft.chainId === 1) {
      url = `https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`;
    } else {
        // Fallback search
        url = `https://opensea.io/assets?search[query]=${nft.contractAddress}`;
    }
    
    if (url) {
        Linking.openURL(url);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.wallet.nfts}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Large NFT Image */}
        <View style={styles.imageContainer}>
            <Image 
                source={{ uri: nft.image }} 
                style={styles.nftImage} 
                resizeMode="cover" 
            />
            {/* Network Badge */}
            <View style={styles.networkBadge}>
                <Text style={styles.networkBadgeText}>{network.name}</Text>
            </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
            <Text style={styles.collectionName}>{nft.collection || 'Unknown Collection'}</Text>
            <Text style={styles.nftName}>{nft.name}</Text>
        </View>

        {/* Action List */}
        <View style={styles.infoList}>
            {/* View on Marketplace */}
            <TouchableOpacity style={styles.infoRow} onPress={openMarketplace}>
                <Text style={styles.infoLabel}>View on Marketplace</Text>
                <Text style={styles.arrowIcon}>↗</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Contract Address */}
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contract Address</Text>
                <TouchableOpacity 
                    style={styles.copyRow}
                    onPress={() => handleCopy(nft.contractAddress)}
                >
                    <Text style={styles.infoValue}>{formatAddress(nft.contractAddress)}</Text>
                    <Text style={styles.copyIcon}>📋</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Token ID */}
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Token ID</Text>
                <Text style={styles.infoValue}>#{nft.tokenId.length > 10 ? nft.tokenId.substring(0, 10) + '...' : nft.tokenId}</Text>
            </View>

            <View style={styles.divider} />

            {/* Token Standard */}
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Token Standard</Text>
                <View style={styles.standardBadge}>
                    <Text style={styles.standardText}>{nft.type || 'ERC721'}</Text>
                </View>
            </View>

             <View style={styles.divider} />

             {/* Network */}
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Network</Text>
                <Text style={styles.infoValue}>{network.name}</Text>
            </View>
        </View>

        {/* Description (if exists) */}
        {nft.description ? (
            <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{nft.description}</Text>
            </View>
        ) : null}

      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.transferButton}
            onPress={() => navigation.navigate('Send', { nft })}
        >
            <Text style={styles.transferButtonText}>{t.common.send}</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#121212',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFF',
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: width,
    height: width, // Square
    position: 'relative',
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  networkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  titleSection: {
    padding: 20,
  },
  collectionName: {
    color: '#F3BA2F',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  nftName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoList: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    color: '#999',
    fontSize: 15,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'monospace', // Monospace for addresses
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyIcon: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F3BA2F',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  standardBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  standardText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  descriptionSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  transferButton: {
    backgroundColor: '#F3BA2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  transferButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
