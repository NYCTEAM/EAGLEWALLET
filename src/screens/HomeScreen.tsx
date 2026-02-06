/**
 * Eagle Wallet - Home Screen
 * Main dashboard showing balance and tokens
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import WalletService from '../services/WalletService';
import MultiWalletService from '../services/MultiWalletService';
import TokenLogoService from '../services/TokenLogoService';
import { useLanguage } from '../i18n/LanguageContext';
import { NETWORKS } from '../config/networks';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  console.log('🏠 HomeScreen: Component rendering');
  const { t } = useLanguage();
  const [balance, setBalance] = useState('0.0000');
  const [address, setAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [walletName, setWalletName] = useState('Main Wallet');
  const [tokens, setTokens] = useState<any[]>([]);
  const [network, setNetwork] = useState(NETWORKS[56]); // Default BSC

  const loadData = async () => {
    console.log('🏠 HomeScreen: loadData called');
    try {
      // Get current wallet info
      const addr = await WalletService.getAddress();
      if (addr) {
        setAddress(addr);
        
        // Get wallet name
        const wallets = await MultiWalletService.getAllWallets();
        const currentWallet = wallets.find(w => w.address.toLowerCase() === addr.toLowerCase());
        if (currentWallet) {
          setWalletName(currentWallet.name);
        }
      }

      // Get balance
      const bal = await WalletService.getBalance();
      // Format balance to 4 decimal places
      const formattedBal = parseFloat(bal).toFixed(4);
      setBalance(formattedBal);
      
      // Get current network
      const currentNet = WalletService.getCurrentNetwork();
      setNetwork(currentNet);

      // In a real app, we would load tokens here
      // For now, mocking some tokens
      setTokens([
        { symbol: currentNet.symbol, name: currentNet.name, balance: formattedBal, price: 0, change: 0, address: 'native' },
        // Add more mock tokens or load from storage
      ]);

    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.walletSelector}
          onPress={() => navigation.navigate('Wallets')}
        >
          <View style={styles.walletIcon} />
          <Text style={styles.walletName}>{walletName}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('DAppBrowser')}>
            <Text style={styles.iconButton}>🌐</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.iconButton}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3BA2F" />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.home.totalBalance}</Text>
          <Text style={styles.balanceValue}>{balance} {network.symbol}</Text>
          <TouchableOpacity 
            style={styles.addressContainer}
            onPress={() => {
              // Copy address logic could go here
              navigation.navigate('Receive');
            }}
          >
            <Text style={styles.addressText}>{formatAddress(address)}</Text>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Send')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↑</Text>
            </View>
            <Text style={styles.actionLabel}>{t.home.send}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Receive')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>↓</Text>
            </View>
            <Text style={styles.actionLabel}>{t.home.receive}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Swap')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>⇄</Text>
            </View>
            <Text style={styles.actionLabel}>{t.home.swap}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TransactionHistory')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🕒</Text>
            </View>
            <Text style={styles.actionLabel}>{t.home.activity}</Text>
          </TouchableOpacity>
        </View>

        {/* Tokens List */}
        <View style={styles.tokensContainer}>
          <View style={styles.tokensHeader}>
            <Text style={styles.tokensTitle}>{t.home.tokens}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddToken')}>
              <Text style={styles.addTokenText}>+ {t.common.add}</Text>
            </TouchableOpacity>
          </View>

          {tokens.map((token, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.tokenItem}
              onPress={() => navigation.navigate('TokenDetail', { token })}
            >
              <View style={styles.tokenIcon}>
                <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
              <View style={styles.tokenBalance}>
                <Text style={styles.balanceText}>{token.balance}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => navigation.navigate('AddToken')}
          >
             <Text style={styles.manageButtonText}>{t.home.manageAddWallets}</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  walletIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3BA2F',
    marginRight: 8,
  },
  walletName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  dropdownIcon: {
    color: '#999',
    fontSize: 10,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    fontSize: 20,
    marginLeft: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  balanceLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  addressText: {
    color: '#999',
    fontSize: 12,
    marginRight: 6,
  },
  copyIcon: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3BA2F',
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
    color: '#F3BA2F',
    fontSize: 12,
    fontWeight: '500',
  },
  tokensContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  tokensHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tokensTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTokenText: {
    color: '#F3BA2F',
    fontSize: 14,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tokenIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenName: {
    color: '#999',
    fontSize: 12,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  manageButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
  },
  manageButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
