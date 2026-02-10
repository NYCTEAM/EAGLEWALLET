import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ethers } from 'ethers';
import WalletService from '../services/WalletService';
import TransactionService, { Transaction } from '../services/TransactionService';
import { useLanguage } from '../i18n/LanguageContext';

export default function TransactionHistoryScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    const address = await WalletService.getAddress();
    const network = WalletService.getCurrentNetwork();

    if (!address) {
      setTxs([]);
      return;
    }

    const [history, pending] = await Promise.all([
      TransactionService.getTransactionHistory(address, network.chainId, 50),
      TransactionService.getPendingTransactions(),
    ]);

    const pendingChain = pending.filter((item) => item.chainId === network.chainId);
    const merged = [...pendingChain, ...history].sort((a, b) => b.timestamp - a.timestamp);
    setTxs(merged);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatAmount = (tx: Transaction) => {
    try {
      if (tx.token?.decimals !== undefined) {
        return `${tx.value} ${tx.token.symbol}`;
      }

      if (tx.value && /^\d+$/.test(tx.value)) {
        return `${parseFloat(ethers.formatEther(BigInt(tx.value))).toFixed(6)} ${WalletService.getCurrentNetwork().symbol}`;
      }

      return `${tx.value} ${WalletService.getCurrentNetwork().symbol}`;
    } catch {
      return tx.value;
    }
  };

  const shortHash = (hash: string) => {
    if (!hash) {
      return '-';
    }
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const statusColor = (status: Transaction['status']) => {
    if (status === 'success') return '#38D39F';
    if (status === 'failed') return '#FF8A9A';
    return '#F2C14F';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.transaction.history}</Text>
        <TouchableOpacity onPress={loadTransactions}>
          <Text style={styles.refresh}>{t.common.refresh}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={txs}
        keyExtractor={(item, index) => `${item.hash}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E9B949" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t.transaction.noTransactions}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('TransactionDetail', { tx: item })}>
            <View style={styles.itemTop}>
              <Text style={styles.hash}>{shortHash(item.hash)}</Text>
              <Text style={[styles.status, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.amount}>{formatAmount(item)}</Text>
            <Text style={styles.meta}>{new Date(item.timestamp).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1014' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
  },
  back: { color: '#E9B949', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  refresh: { color: '#E9B949', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 24 },
  item: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 11,
    padding: 12,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hash: { color: '#D8DEEE', fontSize: 12, fontWeight: '600' },
  status: { fontSize: 11, fontWeight: '700' },
  amount: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  meta: { color: '#98A1B8', fontSize: 11 },
  empty: { color: '#98A1B8', textAlign: 'center', marginTop: 24 },
});
