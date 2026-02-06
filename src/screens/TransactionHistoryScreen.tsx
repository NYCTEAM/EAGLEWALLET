/**
 * Eagle Wallet - Transaction History Screen
 * Complete transaction history with details, hash, and status
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import WalletService from '../services/WalletService';
import TransactionService, { Transaction } from '../services/TransactionService';

export default function TransactionHistoryScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(WalletService.getCurrentNetwork());

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const addr = await WalletService.getAddress();
      if (addr) {
        setAddress(addr);
        const net = WalletService.getCurrentNetwork();
        
        // Get transactions from TransactionService
        const txs = await TransactionService.getTransactionHistory(addr, net.chainId, 50);
        
        // Get pending transactions
        const pending = await TransactionService.getPendingTransactions();
        
        // Combine and sort
        const allTxs = [...pending, ...txs].sort((a, b) => b.timestamp - a.timestamp);
        
        setTransactions(allTxs);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const openExplorer = (txHash: string) => {
    const url = `${network.blockExplorerUrl}/tx/${txHash}`;
    Linking.openURL(url);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isSent = item.from.toLowerCase() === address.toLowerCase();
    const txType = isSent ? 'send' : 'receive';
    
    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
      >
        <View style={styles.txIcon}>
          <Text style={styles.txIconText}>
            {isSent ? 'üì§' : 'üì•'}
          </Text>
        </View>
        
        <View style={styles.txInfo}>
          <View style={styles.txHeader}>
            <Text style={styles.txType}>
              {isSent ? 'Sent' : 'Received'}
            </Text>
            <Text style={[
              styles.txAmount,
              isSent ? styles.txAmountSend : styles.txAmountReceive
            ]}>
              {isSent ? '-' : '+'}{parseFloat(item.value).toFixed(6)} {network.symbol}
            </Text>
          </View>
          
          <View style={styles.txDetails}>
            <Text style={styles.txAddress}>
              {isSent ? 'To: ' : 'From: '}
              {formatAddress(isSent ? item.to : item.from)}
            </Text>
            <Text style={styles.txTime}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <View style={styles.txFooter}>
            <Text style={styles.txHash}>{formatAddress(item.hash)}</Text>
            <View style={[styles.txStatus, styles[`txStatus${item.status}`]]}>
              <Text style={styles.txStatusText}>
                {item.status === 'success' ? '‚ú? : item.status === 'pending' ? '‚è? : '‚ú?}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‚Ü?Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity onPress={() => openExplorer('')}>
          <Text style={styles.explorerButton}>üîç</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.networkText}>{network.name}</Text>
      </View>

      {/* Transaction List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F3BA2F" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>üìú</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Your transaction history will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={styles.listContainer}
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
  explorerButton: {
    fontSize: 24,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  networkText: {
    fontSize: 12,
    color: '#999',
  },
  listContainer: {
    padding: 20,
  },
  txCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIconText: {
    fontSize: 24,
  },
  txInfo: {
    flex: 1,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  txType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  txAmountSend: {
    color: '#E53935',
  },
  txAmountReceive: {
    color: '#43A047',
  },
  txDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  txTime: {
    fontSize: 12,
    color: '#999',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txHash: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  txStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  txStatussuccess: {
    backgroundColor: '#E8F5E9',
  },
  txStatuspending: {
    backgroundColor: '#FFF9C4',
  },
  txStatusfailed: {
    backgroundColor: '#FFEBEE',
  },
  txStatusText: {
    fontSize: 12,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
});
