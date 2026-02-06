/**
 * Eagle Wallet - Home Screen
 * Main wallet interface showing balance and transactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import WalletService from '../services/WalletService';
import { NETWORKS } from '../config/networks';

export default function HomeScreen({ navigation }: any) {
  const [balance, setBalance] = useState('0.00');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(NETWORKS[56]);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const addr = await WalletService.getAddress();
      if (addr) {
        setAddress(addr);
        const bal = await WalletService.getBalance();
        setBalance(bal);
        const net = WalletService.getCurrentNetwork();
        setNetwork(net);
        const txs = await WalletService.getTransactionHistory(10);
        setTransactions(txs);
      }
    } catch (error) {
      console.error('Load wallet data error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const switchNetwork = async () => {
    try {
      const newChainId = network.chainId === 56 ? 196 : 56;
      await WalletService.switchNetwork(newChainId);
      await loadWalletData();
    } catch (error) {
      console.error('Switch network error:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../android/app/src/main/res/drawable/eagle_logo.png')}
            style={styles.logoImage}
          />
          <Text style={styles.logoText}>Eagle Wallet</Text>
        </View>
        <TouchableOpacity onPress={switchNetwork} style={styles.networkButton}>
          <Text style={styles.networkText}>{network.name}</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: network.color + '15' }]}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          {parseFloat(balance).toFixed(4)} {network.symbol}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Receive')}>
          <Text style={styles.address}>{formatAddress(address)}</Text>
        </TouchableOpacity>
        <Text style={styles.usdValue}>≈ $0.00</Text>
      </View>

      {/* Action Buttons - Row 1 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Send')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Receive')}
        >
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('NFT')}
        >
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>NFTs</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Row 2 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DAppBrowser')}
        >
          <Text style={styles.actionIcon}>🌐</Text>
          <Text style={styles.actionText}>DApps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>

        <View style={styles.actionButton} />
      </View>

      {/* Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDescription}>Your transaction history will appear here</Text>
          </View>
        ) : (
          transactions.map((tx, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.txInfo}>
                <Text style={styles.txType}>
                  {tx.from.toLowerCase() === address.toLowerCase() ? '📤 Sent' : '📥 Received'}
                </Text>
                <Text style={styles.txAddress}>
                  {tx.from.toLowerCase() === address.toLowerCase()
                    ? `To: ${formatAddress(tx.to)}`
                    : `From: ${formatAddress(tx.from)}`}
                </Text>
              </View>
              <Text style={styles.txAmount}>
                {tx.value} {network.symbol}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  networkButton: {
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  networkText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  balanceCard: {
    margin: 16,
    marginTop: 12,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -1,
  },
  address: {
    fontSize: 13,
    color: '#F3BA2F',
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 4,
  },
  usdValue: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  transactionsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAllText: {
    fontSize: 14,
    color: '#F3BA2F',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  txAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
