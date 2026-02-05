/**
 * Eagle Wallet - Transaction Detail Screen
 * Detailed transaction information with hash, gas, and block explorer link
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Clipboard,
  Alert,
} from 'react-native';
import WalletService from '../services/WalletService';

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { transaction, txHash } = route.params;
  const network = WalletService.getCurrentNetwork();

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const openExplorer = () => {
    const hash = transaction?.hash || txHash;
    const url = `${network.blockExplorerUrl}/tx/${hash}`;
    Linking.openURL(url);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const tx = transaction || {
    hash: txHash,
    from: '',
    to: '',
    value: '0',
    timestamp: Date.now() / 1000,
    status: 'pending',
    type: 'send',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
        <TouchableOpacity onPress={openExplorer}>
          <Text style={styles.explorerButton}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>
            {tx.status === 'success' ? '✓' : tx.status === 'pending' ? '⏳' : '✗'}
          </Text>
          <Text style={styles.statusText}>
            {tx.status === 'success' ? 'Confirmed' : tx.status === 'pending' ? 'Pending' : 'Failed'}
          </Text>
          <Text style={styles.statusSubtext}>
            {tx.type === 'send' ? 'Sent' : 'Received'}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={[
            styles.amountValue,
            tx.type === 'send' ? styles.amountSend : styles.amountReceive
          ]}>
            {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.value).toFixed(6)} {network.symbol}
          </Text>
        </View>

        {/* Transaction Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          {/* Hash */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction Hash</Text>
            <TouchableOpacity onPress={() => copyToClipboard(tx.hash, 'Hash')}>
              <Text style={styles.infoValue} numberOfLines={1}>
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)} 📋
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[
              styles.statusBadge,
              tx.status === 'success' && styles.statussuccess,
              tx.status === 'pending' && styles.statuspending,
              tx.status === 'failed' && styles.statusfailed,
            ]}>
              <Text style={styles.statusBadgeText}>
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Timestamp */}
          {tx.timestamp && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatDate(tx.timestamp)}</Text>
            </View>
          )}

          {/* From */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From</Text>
            <TouchableOpacity onPress={() => copyToClipboard(tx.from, 'Address')}>
              <Text style={styles.infoValueMono}>
                {tx.from.slice(0, 6)}...{tx.from.slice(-4)} 📋
              </Text>
            </TouchableOpacity>
          </View>

          {/* To */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To</Text>
            <TouchableOpacity onPress={() => copyToClipboard(tx.to, 'Address')}>
              <Text style={styles.infoValueMono}>
                {tx.to.slice(0, 6)}...{tx.to.slice(-4)} 📋
              </Text>
            </TouchableOpacity>
          </View>

          {/* Network */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network</Text>
            <Text style={styles.infoValue}>{network.name}</Text>
          </View>

          {/* Chain ID */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chain ID</Text>
            <Text style={styles.infoValue}>{network.chainId}</Text>
          </View>
        </View>

        {/* Gas Info */}
        {tx.gasUsed && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Gas Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gas Used</Text>
              <Text style={styles.infoValue}>{tx.gasUsed}</Text>
            </View>

            {tx.gasPrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gas Price</Text>
                <Text style={styles.infoValue}>{tx.gasPrice} Gwei</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transaction Fee</Text>
              <Text style={styles.infoValue}>
                ~0.0001 {network.symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={styles.explorerButton2} onPress={openExplorer}>
          <Text style={styles.explorerButtonText}>
            View on {network.name} Explorer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => copyToClipboard(tx.hash, 'Transaction Hash')}
        >
          <Text style={styles.shareButtonText}>Share Transaction</Text>
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
