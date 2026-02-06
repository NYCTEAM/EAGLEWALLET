/**
 * Eagle Wallet - Transaction Detail Screen
 * View details of a specific transaction
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

export default function TransactionDetailScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const { transaction: tx } = route.params;
  const network = WalletService.getCurrentNetwork();

  const openExplorer = () => {
    const url = `${network.blockExplorerUrl}/tx/${tx.hash}`;
    Linking.openURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert(t.common.copied, `${label} ${t.receive.addressCopied.replace('Address', '')}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.transaction.transactionDetails}</Text>
        <TouchableOpacity onPress={openExplorer}>
          <Text style={styles.explorerButton}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>
            {tx.status === 'success' ? '✓' : tx.status === 'pending' ? '⏳' : '✕'}
          </Text>
          <Text style={styles.statusText}>
            {tx.status === 'success' ? t.transaction.confirmed : tx.status === 'pending' ? t.transaction.pending : t.transaction.failed}
          </Text>
          <Text style={styles.statusSubtext}>
            {tx.type === 'send' ? t.send.sent : t.receive.received}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t.transaction.amount}</Text>
          <Text style={[
            styles.amountValue,
            tx.type === 'send' ? styles.amountSend : styles.amountReceive
          ]}>
            {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.value).toFixed(6)} {network.symbol}
          </Text>
        </View>

        {/* Transaction Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t.transaction.transactionDetails}</Text>

          {/* Hash */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.transaction.hash}</Text>
            <TouchableOpacity onPress={() => copyToClipboard(tx.hash, t.transaction.hash)}>
              <Text style={styles.infoValue} numberOfLines={1}>
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)} 📋
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.transaction.status}</Text>
            <View style={[
              styles.statusBadge,
              tx.status === 'success' && styles.statussuccess,
              tx.status === 'pending' && styles.statuspending,
              tx.status === 'failed' && styles.statusfailed,
            ]}>
              <Text style={styles.statusBadgeText}>
                {tx.status === 'success' ? t.transaction.success : tx.status === 'pending' ? t.transaction.pending : t.transaction.failure}
              </Text>
            </View>
          </View>

          {/* Timestamp */}
          {tx.timestamp && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.transaction.time}</Text>
              <Text style={styles.infoValue}>{formatDate(tx.timestamp)}</Text>
            </View>
          )}

          {/* From */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.transaction.from}</Text>
            <TouchableOpacity onPress={() => copyToClipboard(tx.from, t.transaction.from)}>
              <Text style={styles.infoValueMono}>
                {tx.from.slice(0, 6)}...{tx.from.slice(-4)} 📋
              </Text>
            </TouchableOpacity>
          </View>

          {/* To */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.transaction.to}</Text>
            <TouchableOpacity onPress={() => copyToClipboard(tx.to, t.transaction.to)}>
              <Text style={styles.infoValueMono}>
                {tx.to.slice(0, 6)}...{tx.to.slice(-4)} 📋
              </Text>
            </TouchableOpacity>
          </View>

          {/* Network */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.network.network}</Text>
            <Text style={styles.infoValue}>{network.name}</Text>
          </View>

          {/* Chain ID */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.network.chainId}</Text>
            <Text style={styles.infoValue}>{network.chainId}</Text>
          </View>
        </View>

        {/* Gas Info */}
        {tx.gasUsed && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>{t.send.gasFee}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.transaction.gasUsed}</Text>
              <Text style={styles.infoValue}>{tx.gasUsed}</Text>
            </View>

            {tx.gasPrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.transaction.gasPrice}</Text>
                <Text style={styles.infoValue}>{tx.gasPrice} Gwei</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.transaction.fee}</Text>
              <Text style={styles.infoValue}>
                ~0.0001 {network.symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={styles.explorerButton2} onPress={openExplorer}>
          <Text style={styles.explorerButtonText}>
            {t.transaction.viewOnExplorer}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => copyToClipboard(tx.hash, t.transaction.hash)}
        >
          <Text style={styles.shareButtonText}>{t.common.share}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  explorerButton: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  amountSend: {
    color: '#E53935',
  },
  amountReceive: {
    color: '#43A047',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  infoValueMono: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statussuccess: {
    backgroundColor: '#E8F5E9',
  },
  statuspending: {
    backgroundColor: '#FFF9C4',
  },
  statusfailed: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  explorerButton2: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  explorerButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3BA2F',
    marginBottom: 24,
  },
  shareButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
