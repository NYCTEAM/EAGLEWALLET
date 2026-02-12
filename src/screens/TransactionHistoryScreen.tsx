import React, { useCallback, useMemo, useState } from 'react';
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
import SwapMiningService from '../services/SwapMiningService';
import RewardsDappService from '../services/RewardsDappService';

export default function TransactionHistoryScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmThreshold = 12;

  const loadTransactions = useCallback(async () => {
    setError(null);
    const address = await WalletService.getAddress();
    const network = WalletService.getCurrentNetwork();

    if (!address) {
      setTxs([]);
      return;
    }

    try {
      const [history, pending, mining] = await Promise.all([
        TransactionService.getTransactionHistory(address, network.chainId, 50),
        TransactionService.getPendingTransactions(),
        SwapMiningService.getUserTransactions(address, 50),
      ]);

      const pendingChain = pending.filter((item) => item.chainId === network.chainId);
      const provider = await WalletService.getProvider();
      const pendingUpdates = await Promise.all(
        pendingChain.map(async (item) => {
          try {
            const detail = await TransactionService.getTransactionDetail(item.hash, network.chainId, provider);
            if (detail && detail.status !== 'pending') {
              await TransactionService.updateTransactionStatus(item.hash, detail.status);
            }
            return detail ? { ...item, ...detail } : item;
          } catch {
            return item;
          }
        })
      );

      const txMap = new Map<string, Transaction>();
      pendingUpdates.forEach((item) => txMap.set(item.hash.toLowerCase(), item));
      history.forEach((item) => {
        const key = item.hash.toLowerCase();
        const existing = txMap.get(key);
        txMap.set(key, existing ? { ...existing, ...item } : item);
      });

      const miningTxs = mining?.data?.transactions || [];
      const miningMap = new Map<string, any>(
        miningTxs.map((tx: any) => [String(tx.tx_hash || tx.hash || '').toLowerCase(), tx])
      );

      const merged = Array.from(txMap.values())
        .map((item) => {
          const miningInfo = miningMap.get(item.hash.toLowerCase());
          const reward = miningInfo?.eagle_reward ?? miningInfo?.eagle_earned ?? miningInfo?.eagleReward;
          const rewardNum =
            typeof reward === 'number' ? reward : reward !== undefined && reward !== null ? Number(reward) : undefined;
          const safeReward = Number.isFinite(rewardNum) ? rewardNum : undefined;
          return {
            ...item,
            swapReward: safeReward,
            swapRoute: miningInfo?.route_info,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      setTxs(merged);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(t.errors.connectionFailed);
      setTxs([]);
    }
  }, [t]);


  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      const interval = setInterval(loadTransactions, 15000);
      return () => clearInterval(interval);
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

  const getDisplayStatus = useCallback((tx: Transaction) => {
    if (tx.status === 'pending') {
      return { label: t.transaction.pending, color: '#F2C14F' };
    }
    if (tx.status === 'failed') {
      return { label: t.transaction.failed, color: '#FF8A9A' };
    }
    if (tx.confirmations !== undefined && tx.confirmations < confirmThreshold) {
      return { label: t.transaction.confirming, color: '#F2C14F' };
    }
    return { label: t.transaction.confirmed || t.transaction.completed, color: '#38D39F' };
  }, [t, confirmThreshold]);

  const emptyComponent = useMemo(() => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTransactions}>
            <Text style={styles.retryButtonText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <Text style={styles.empty}>{t.transaction.noTransactions}</Text>;
  }, [error, loadTransactions, t]);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.transaction.history}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={async () => {
              const url = await RewardsDappService.getRewardsUrl();
              navigation.navigate('DAppWebView', {
                url,
                title: t.transaction.viewRewards,
                autoConnect: true,
              });
            }}
          >
            <Text style={styles.rewards}>{t.transaction.viewRewards}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={loadTransactions}>
            <Text style={styles.refresh}>{t.common.refresh}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={txs}
        keyExtractor={(item, index) => `${item.hash}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E9B949" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={emptyComponent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('TransactionDetail', { tx: item })}>
            <View style={styles.itemTop}>
              <Text style={styles.hash}>{shortHash(item.hash)}</Text>
              {(() => {
                const meta = getDisplayStatus(item);
                return (
                  <Text style={[styles.status, { color: meta.color }]}>{meta.label}</Text>
                );
              })()}
            </View>
            <Text style={styles.amount}>{formatAmount(item)}</Text>
            {item.swapReward !== undefined && (
              <Text style={styles.reward}>{`${t.transaction.miningReward}: ${item.swapReward.toFixed(4)} EAGLE`}</Text>
            )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: { color: '#E9B949', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  rewards: { color: '#38D39F', fontSize: 13, fontWeight: '700', marginRight: 12 },
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
  reward: { color: '#38D39F', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  meta: { color: '#98A1B8', fontSize: 11 },
  emptyContainer: { alignItems: 'center', marginTop: 24 },
  empty: { color: '#98A1B8', textAlign: 'center' },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E3550',
  },
  retryButtonText: { color: '#E9B949', fontSize: 12, fontWeight: '600' },
});
