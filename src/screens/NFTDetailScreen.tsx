/**
 * Eagle Wallet - NFT Detail Screen
 * Show detailed information about a specific NFT
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { NFT } from '../services/NFTService';
import NFTService from '../services/NFTService';
import WalletService from '../services/WalletService';

export default function NFTDetailScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { nft }: { nft: NFT } = route.params;
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferring, setTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!recipientAddress || recipientAddress.length !== 42) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }

    Alert.alert(
      'Confirm Transfer',
      `Transfer ${nft.name} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            try {
              setTransferring(true);
              // Get wallet instance (you'll need to implement this in WalletService)
              // const wallet = await WalletService.getWalletInstance();
              // const txHash = await NFTService.transferNFT(
              //   wallet,
              //   nft.contractAddress,
              //   nft.tokenId,
              //   recipientAddress,
              //   nft.chainId
              // );
              
              Alert.alert('Success', 'NFT transferred successfully!');
              setShowTransferModal(false);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to transfer NFT');
            } finally {
              setTransferring(false);
            }
          },
        },
      ]
    );
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>â†?Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NFT Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView>
        {/* NFT Image */}
        <Image
          source={{ uri: nft.image || 'https://via.placeholder.com/400' }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* NFT Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.collection}>{nft.collection}</Text>
          <Text style={styles.name}>{nft.name}</Text>
          <Text style={styles.tokenId}>Token ID: #{nft.tokenId}</Text>

          {nft.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{nft.description}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contract Address</Text>
              <Text style={styles.detailValue}>
                {formatAddress(nft.contractAddress)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Token Standard</Text>
              <Text style={styles.detailValue}>ERC-721</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Chain</Text>
              <Text style={styles.detailValue}>
                {nft.chainId === 56 ? 'BSC' : 'XLAYER'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.transferButton}
            onPress={() => setShowTransferModal(true)}
          >
            <Text style={styles.transferButtonText}>Transfer NFT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transfer NFT</Text>
            
            <Text style={styles.modalLabel}>Recipient Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0x..."
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTransferModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleTransfer}
                disabled={transferring}
              >
                <Text style={styles.confirmButtonText}>
                  {transferring ? 'Transferring...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#E0E0E0',
  },
  infoContainer: {
    padding: 20,
  },
  collection: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  tokenId: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  transferButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  transferButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#F3BA2F',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
