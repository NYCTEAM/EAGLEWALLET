/**
 * Eagle Wallet - Token Detail Screen
 * Shows detailed token info, actions, and transaction history
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ethers } from 'ethers';
import { useLanguage } from '../i18n/LanguageContext';
import WalletService from '../services/WalletService';
import TransactionService, { Transaction } from '../services/TransactionService';
import TokenLogoService from '../services/TokenLogoService';

export default function TokenDetailScreen({ route, navigation }: any) {
  const { token } = route.params;
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'info'>('activity');
  const [currentAddress, setCurrentAddress] = useState('');

  const network = WalletService.getCurrentNetwork();
  const tokenLogo = TokenLogoService.getTokenLogo(token.logo || token.symbol);
  const isNative = token.address === 'native';

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const address = await WalletService.getAddress();
        if (!address) {
          setTransactions([]);
          return;
        }

        setCurrentAddress(address);
        const txs = await TransactionService.getTransactionHistory(address, network.chainId);
        setTransactions(txs);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [network.chainId]);

  const displayBalanceValue = useMemo(() => {
    const value = token.value ?? '0';
    return `$${value}`;
  }, [token.value]);

  const openExplorer = (value: string, type: 'tx' | 'token' = 'tx') => {
    const path = type === 'token' ? 'token' : 'tx';
    Linking.openURL(`${network.blockExplorerUrl}/${path}/${value}`);
  };

  const copyAddress = () => {
    Clipboard.setString(token.address);
    Alert.alert(t.common.copied, t.receive.addressCopied);
  };

  const formatTxAmount = (raw: string): string => {
    if (!raw) {
      return '0';
    }

    if (isNative) {
      try {
        return Number(ethers.formatEther(raw)).toFixed(6);
      } catch {
        return raw;
      }
    }

    return raw;
  };

  const renderActivityItem = (tx: Transaction, index: number) => {
    const isReceived = tx.to.toLowerCase() === currentAddress.toLowerCase();
    const amount = formatTxAmount(tx.value);

    return (
      <TouchableOpacity
        key={`${tx.hash}_${index}`}
        style={styles.txItem}
        onPress={() => openExplorer(tx.hash, 'tx')}
      >
        <Text style={styles.txIcon}>{isReceived ? 'IN' : 'OUT'}</Text>
        <View style={styles.txInfo}>
          <Text style={styles.txType}>{isReceived ? t.common.receive : t.common.send}</Text>
          <Text style={styles.txStatus}>
            {tx.status === 'success' ? t.common.success : t.transaction.failed} -{' '}
            {new Date(tx.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: isReceived ? '#43A047' : '#FFFFFF' }]}>
          {isReceived ? '+' : '-'}
          {amount} {token.symbol}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{token.symbol}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          {tokenLogo ? (
            <Image source={tokenLogo} style={styles.largeLogo} />
          ) : (
            <View style={[styles.largeIconPlaceholder, { backgroundColor: token.color || '#F3BA2F' }]}>
              <Text style={styles.largeIconText}>{token.symbol[0]}</Text>
            </View>
          )}
          <Text style={styles.balanceAmount}>
            {token.balance} {token.symbol}
          </Text>
          <Text style={styles.balanceValue}>{displayBalanceValue}</Text>

          {token.change !== undefined ? (
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor:
                    token.change >= 0 ? 'rgba(67, 160, 71, 0.1)' : 'rgba(229, 57, 53, 0.1)',
                },
              ]}
            >
              <Text style={[styles.changeText, { color: token.change >= 0 ? '#43A047' : '#E53935' }]}>
                {token.change >= 0 ? '+' : ''}
                {token.change.toFixed(2)}%
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Send', { token })}>
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionIcon}>S</Text>
            </View>
            <Text style={styles.actionLabel}>{t.common.send}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Receive', { token })}>
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionIcon}>R</Text>
            </View>
            <Text style={styles.actionLabel}>{t.common.receive}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Swap', { fromToken: token })}>
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionIcon}>X</Text>
            </View>
            <Text style={styles.actionLabel}>{t.home.swap}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>{t.token.activity}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'info' && styles.activeTab]} onPress={() => setActiveTab('info')}>
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>{t.token.info}</Text>
          </TouchableOpacity>
        </View>

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
              <Text style={styles.infoLabel}>{t.token.contract}</Text>
              <TouchableOpacity onPress={copyAddress}>
                <Text style={styles.infoValue}>
                  {isNative ? network.symbol : `${token.address.substring(0, 10)}...${token.address.substring(38)}`}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Decimals</Text>
              <Text style={styles.infoValue}>{token.decimals}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.receive.network}</Text>
              <Text style={styles.infoValue}>{network.name}</Text>
            </View>
            {!isNative ? (
              <TouchableOpacity style={styles.explorerButton} onPress={() => openExplorer(token.address, 'token')}>
                <Text style={styles.explorerButtonText}>{t.token.viewOnExplorer}</Text>
              </TouchableOpacity>
            ) : null}
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
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceValue: {
    color: '#AAA',
    fontSize: 18,
    marginBottom: 16,
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 30,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  actionLabel: {
    color: '#FFF',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F3BA2F',
  },
  tabText: {
    color: '#AAA',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  txIcon: {
    color: '#F3BA2F',
    fontSize: 11,
    fontWeight: '700',
    width: 34,
    textAlign: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txType: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  txStatus: {
    color: '#AAA',
    fontSize: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#AAA',
    textAlign: 'center',
    marginTop: 30,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  infoLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  explorerButton: {
    marginTop: 24,
    backgroundColor: '#F3BA2F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  explorerButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
