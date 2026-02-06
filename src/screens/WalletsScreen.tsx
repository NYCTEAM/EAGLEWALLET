/**
 * Eagle Wallet - Wallets Management Screen
 * Manage multiple wallet accounts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import MultiWalletService from '../services/MultiWalletService';
import { WalletAccount } from '../storage/WalletStorage';
import WalletService from '../services/WalletService';

export default function WalletsScreen({ navigation }: any) {
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const allWallets = await MultiWalletService.getAllWallets();
      const active = await MultiWalletService.getActiveWallet();
      setWallets(allWallets);
      setActiveWalletId(active?.id || '');
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallets();
    setRefreshing(false);
  };

  const handleSwitchWallet = async (walletId: string) => {
    try {
      await MultiWalletService.switchWallet(walletId);
      setActiveWalletId(walletId);
      Alert.alert('Success', 'Wallet switched successfully');
      // Reload app state
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to switch wallet');
    }
  };

  const handleDeleteWallet = (wallet: WalletAccount) => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MultiWalletService.deleteWallet(wallet.id, '');
              await loadWallets();
              Alert.alert('Success', 'Wallet deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete wallet');
            }
          },
        },
      ]
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderWalletItem = ({ item }: { item: WalletAccount }) => {
    const isActive = item.id === activeWalletId;

    return (
      <TouchableOpacity
        style={[styles.walletCard, isActive && styles.activeWalletCard]}
        onPress={() => !isActive && handleSwitchWallet(item.id)}
        onLongPress={() => navigation.navigate('WalletDetail', { wallet: item })}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletLeft}>
            <View style={[styles.walletIcon, { backgroundColor: item.color || '#F3BA2F' }]}>
              <Text style={styles.walletIconText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>{item.name}</Text>
              <Text style={styles.walletAddress}>{formatAddress(item.address)}</Text>
              <Text style={styles.walletType}>
                {item.type === 'watch' ? '👁️ Watch Only' : '🔐 Full Access'}
              </Text>
            </View>
          </View>
          
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓ Active</Text>
            </View>
          )}
        </View>

        {!isActive && wallets.length > 1 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteWallet(item)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Wallets</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddWallet')}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet List */}
      <FlatList
        data={wallets}
        renderItem={renderWalletItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👛</Text>
            <Text style={styles.emptyText}>No wallets found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('AddWallet')}
            >
              <Text style={styles.createButtonText}>Create Wallet</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Tap to switch wallet, long press for details
        </Text>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  addButton: {
    fontSize: 32,
    color: '#F3BA2F',
    fontWeight: '300',
  },
  listContent: {
    padding: 20,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeWalletCard: {
    borderWidth: 2,
    borderColor: '#F3BA2F',
    backgroundColor: '#FFF9E6',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  walletType: {
    fontSize: 11,
    color: '#999',
  },
  activeBadge: {
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  deleteButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
