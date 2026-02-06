/**
 * Eagle Wallet - Token Detail Screen
 * Shows detailed information about a specific token
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

export default function TokenDetailScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { token } = route.params || {};
  const [selectedChain, setSelectedChain] = useState('BNB Chain');

  const chains = ['BNB Chain', 'X Layer', 'Ethereum', 'Polygon'];

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const mockAddress = '0xf4f0273696cc3bb2cffe8bb8e9f320586';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>�?/Text>
        </TouchableOpacity>
        <View style={styles.tokenHeader}>
          <View style={[styles.tokenIconLarge, { backgroundColor: token?.color || '#26A17B20' }]}>
            <Text style={styles.tokenIconTextLarge}>{token?.symbol?.charAt(0) || 'T'}</Text>
          </View>
          <Text style={styles.tokenName}>{token?.name || 'USDT'}</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Text style={styles.infoIcon}>�?/Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Chain Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainSelector}>
          {chains.map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[styles.chainButton, selectedChain === chain && styles.chainButtonActive]}
              onPress={() => setSelectedChain(chain)}
            >
              <Text style={[styles.chainText, selectedChain === chain && styles.chainTextActive]}>
                {chain}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceAmount}>{token?.amount || '7,727.08'}</Text>
          <Text style={styles.balanceUSD}>${token?.value || '7,717.19'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('SelectToken', { action: 'send' })}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>�?/Text>
            </View>
            <Text style={styles.actionText}>发�?/Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Receive', { token })}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>�?/Text>
            </View>
            <Text style={styles.actionText}>接收</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>�?/Text>
            </View>
            <Text style={styles.actionText}>兑换</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>�?/Text>
            </View>
            <Text style={styles.actionText}>跨链�?/Text>
          </TouchableOpacity>
        </View>

        {/* DeFi Banner */}
        <View style={styles.defiBanner}>
          <View style={styles.defiIcon}>
            <Text style={styles.defiIconText}>💰</Text>
          </View>
          <View style={styles.defiInfo}>
            <Text style={styles.defiTitle}>年化收益高达 1.03%</Text>
            <Text style={styles.defiSubtitle}>立即开�?DeFi 赚币</Text>
          </View>
        </View>

        {/* Receive Address */}
        <View style={styles.addressSection}>
          <Text style={styles.addressLabel}>收款地址</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{mockAddress}</Text>
            <TouchableOpacity onPress={() => Alert.alert('Copied', 'Address copied to clipboard')}>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.historySection}>
          <Text style={styles.historyDate}>2026/02/05</Text>
          <TouchableOpacity style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Text style={styles.historyIconText}>📄</Text>
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>合约交互</Text>
              <Text style={styles.historyAddress}>0xc780...51f6</Text>
            </View>
            <Text style={styles.historyAmount}>+222.2 USDT</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tokenIconLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tokenIconTextLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  chainSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  chainButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  chainButtonActive: {
    backgroundColor: '#000',
  },
  chainText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  chainTextActive: {
    color: '#FFF',
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  balanceUSD: {
    fontSize: 18,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  defiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  defiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE066',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defiIconText: {
    fontSize: 20,
  },
  defiInfo: {
    flex: 1,
  },
  defiTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  defiSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  addressSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  historyDate: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIconText: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  historyAddress: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#26A17B',
  },
});
