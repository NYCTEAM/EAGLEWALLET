/**
 * Eagle Wallet - Token Detail Screen
 * Shows detailed token info, actions, and transaction history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Clipboard,
  Alert,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import WalletService from '../services/WalletService';
import TransactionService, { Transaction } from '../services/TransactionService';
import TokenLogoService from '../services/TokenLogoService';
import { NETWORKS } from '../config/networks';

export default function TokenDetailScreen({ route, navigation }: any) {
  const { token } = route.params;
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'info'>('activity');
  const [currentAddress, setCurrentAddress] = useState<string>('');

  const network = WalletService.getCurrentNetwork();
  const tokenLogo = TokenLogoService.getTokenLogo(token.logo || token.symbol);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const address = await WalletService.getAddress();
    if (address) {
        setCurrentAddress(address);
        // Fetch transactions (mock or real)
        const txs = await TransactionService.getTransactionHistory(address, network.chainId);
        
        // For demo purposes, allow TransactionService to return mock data if real API fails or returns empty
        if (txs.length === 0) {
            const mockTxs: Transaction[] = [
                {
                    hash: '0x3b1c784920384729384729384729384729384729384729384729384729389d2e',
                    from: address,
                    to: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c4327',
                    value: '10.5',
                    timestamp: Date.now() - 1000 * 60 * 30,
                    status: 'success',
                    nonce: 1,
                    chainId: 56,
                    token: { address: token.address, symbol: token.symbol, decimals: token.decimals }
                },
                {
                    hash: '0x7e8f123412341234123412341234123412341234123412341234123412345a1b',
                    from: '0xBinanceHotWallet',
                    to: address,
                    value: '50.0',
                    timestamp: Date.now() - 1000 * 60 * 60 * 24,
                    status: 'success',
                    nonce: 0,
                    chainId: 56,
                    token: { address: token.address, symbol: token.symbol, decimals: token.decimals }
                }
            ];
            setTransactions(mockTxs);
        } else {
            setTransactions(txs);
        }
    }
    setLoading(false);
  };

  const openExplorer = (value: string, type: 'tx' | 'token' = 'tx') => {
    const path = type === 'token' ? 'token' : 'tx';
    const url = `${network.blockExplorerUrl}/${path}/${value}`;
    Linking.openURL(url);
  };

  const copyAddress = () => {
    Clipboard.setString(token.address);
    Alert.alert(t.common.copied, t.receive.addressCopied);
  };

  const renderActivityItem = (tx: Transaction, index: number) => {
    const isReceived = tx.to.toLowerCase() === currentAddress.toLowerCase();
    
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.txItem}
        onPress={() => openExplorer(tx.hash, 'tx')}
      >
        <View style={styles.txIconContainer}>
            <Text style={styles.txIcon}>{isReceived ? '↓' : '↑'}</Text>
        </View>
        <View style={styles.txInfo}>
            <Text style={styles.txType}>{isReceived ? t.common.receive : t.common.send}</Text>
            <Text style={styles.txStatus}>
                {tx.status === 'success' ? t.common.success : t.common.failed}
                {' • '}
                {new Date(tx.timestamp).toLocaleDateString()}
            </Text>
        </View>
        <View style={styles.txAmountContainer}>
            <Text style={[styles.txAmount, { color: isReceived ? '#43A047' : '#FFFFFF' }]}>
                {isReceived ? '+' : '-'}{tx.value} {token.symbol}
            </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{token.symbol}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Token Info Card */}
        <View style={styles.balanceCard}>
            {tokenLogo ? (
                <Image source={tokenLogo} style={styles.largeLogo} />
            ) : (
                <View style={[styles.largeIconPlaceholder, { backgroundColor: token.color || '#F3BA2F' }]}>
                    <Text style={styles.largeIconText}>{token.symbol[0]}</Text>
                </View>
            )}
            <Text style={styles.balanceAmount}>{token.balance} {token.symbol}</Text>
            <Text style={styles.balanceValue}>≈ ${token.value}</Text>
            
            {/* Price Change Badge */}
            {token.change !== undefined && (
                <View style={[
                    styles.changeBadge, 
                    { backgroundColor: token.change >= 0 ? 'rgba(67, 160, 71, 0.1)' : 'rgba(229, 57, 53, 0.1)' }
                ]}>
                    <Text style={[
                        styles.changeText, 
                        { color: token.change >= 0 ? '#43A047' : '#E53935' }
                    ]}>
                        {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
                    </Text>
                </View>
            )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Send', { token })}>
                <View style={styles.actionIconCircle}>
                    <Text style={styles.actionIcon}>↑</Text>
                </View>
                <Text style={styles.actionLabel}>{t.common.send}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Receive', { token })}>
                <View style={styles.actionIconCircle}>
                    <Text style={styles.actionIcon}>↓</Text>
                </View>
                <Text style={styles.actionLabel}>{t.common.receive}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Swap', { fromToken: token })}>
                <View style={styles.actionIconCircle}>
                    <Text style={styles.actionIcon}>⇄</Text>
                </View>
                <Text style={styles.actionLabel}>{t.home.swap}</Text>
            </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
                onPress={() => setActiveTab('activity')}
            >
                <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                onPress={() => setActiveTab('info')}
            >
                <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
            </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'activity' ? (
            <View style={styles.listContainer}>
                {loading ? (
                    <ActivityIndicator color="#F3BA2F" style={{ marginTop: 20 }} />
                ) : transactions.length > 0 ? (
                    transactions.map((tx, i) => renderActivityItem(tx, i))
                ) : (
                    <Text style={styles.emptyText}>{t.transaction.noTransactions}</Text>
                )}
            </View>
        ) : (
            <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Contract Address</Text>
                    <TouchableOpacity onPress={copyAddress}>
                        <Text style={styles.infoValue}>
                            {token.address === 'native' ? 'Native Token' : `${token.address.substring(0, 10)}...${token.address.substring(38)} ❐`}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Decimals</Text>
                    <Text style={styles.infoValue}>{token.decimals}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Network</Text>
                    <Text style={styles.infoValue}>{network.name}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.explorerButton}
                    onPress={() => token.address !== 'native' && openExplorer(token.address, 'token')}
                >
                    <Text style={styles.explorerButtonText}>View on Explorer ↗</Text>
                </TouchableOpacity>
            </View>
        )}
      </ScrollView>
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
    paddingBottom: 40,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  largeLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  largeIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceValue: {
    color: '#999',
    fontSize: 16,
  },
  changeBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    marginVertical: 24,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  actionLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F3BA2F',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIcon: {
    color: '#999',
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  txStatus: {
    color: '#666',
    fontSize: 12,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  infoContainer: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
  },
  explorerButton: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  explorerButtonText: {
    color: '#F3BA2F',
    fontWeight: '600',
  },
});
