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
import TokenService from '../services/TokenService';
import CustomTokenService from '../services/CustomTokenService';
import TokenLogoService from '../services/TokenLogoService';
import { NETWORKS } from '../config/networks';
import { getChainTokens } from '../config/tokenConfig';

export default function HomeScreen({ navigation }: any) {
  const [balance, setBalance] = useState('0.00');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(NETWORKS[56]);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokens, setTokens] = useState<any[]>([]);
  const [customTokens, setCustomTokens] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState('0.00');

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
        console.log('Current Network:', net.chainId, net.name);
        setNetwork(net);
        const txs = await WalletService.getTransactionHistory(10);
        setTransactions(txs);
        
        // Load mainstream tokens (always show)
        console.log('Fetching tokens for chain:', net.chainId);
        const mainTokens = await TokenService.getUserTokens(net.chainId);
        console.log('Loaded mainstream tokens:', mainTokens.length);
        setTokens(mainTokens);
        
        // Load user's custom tokens for current chain
        const allCustomTokens = await CustomTokenService.getCustomTokens();
        const userCustomTokens = allCustomTokens.filter(t => t.chainId === net.chainId);
        console.log('Loaded custom tokens:', userCustomTokens.length);
        
        // Fetch balances for custom tokens
        const customTokensWithBalance: any[] = [];
        for (const token of userCustomTokens) {
          try {
            const balance = await TokenService.getTokenBalance(
              token.address,
              addr,
              await WalletService.getProvider()
            );
            customTokensWithBalance.push({
              ...token,
              balance: balance,
              balanceFormatted: balance,
              value: '0.00',
              icon: token.symbol.charAt(0),
              color: '#999999',
            });
          } catch (error) {
            console.error('Error loading custom token:', error);
          }
        }
        
        // Update prices for custom tokens
        if (customTokensWithBalance.length > 0) {
          await TokenService.updateTokenPrices(customTokensWithBalance, net.chainId);
        }
        
        setCustomTokens(customTokensWithBalance);
        
        // Calculate total portfolio value
        const total = [...mainTokens, ...customTokensWithBalance].reduce((sum, token) => {
          return sum + parseFloat(token.value || '0');
        }, 0);
        setTotalValue(total.toFixed(2));
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
    <View style={styles.container}>
    <ScrollView
      style={styles.scrollView}
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
          ${totalValue}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Receive')}>
          <Text style={styles.address}>{formatAddress(address)}</Text>
        </TouchableOpacity>
        <Text style={styles.usdValue}>
          {parseFloat(balance).toFixed(4)} {network.symbol}
        </Text>
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
          onPress={() => navigation.navigate('Swap')}
        >
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Swap</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Row 2 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('NFT')}
        >
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>NFTs</Text>
        </TouchableOpacity>

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
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tokens' && styles.activeTab]}
          onPress={() => setActiveTab('tokens')}
        >
          <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>Tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'nft' && styles.activeTab]}
          onPress={() => setActiveTab('nft')}
        >
          <Text style={[styles.tabText, activeTab === 'nft' && styles.activeTabText]}>NFT</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'defi' && styles.activeTab]}
          onPress={() => setActiveTab('defi')}
        >
          <Text style={[styles.tabText, activeTab === 'defi' && styles.activeTabText]}>DeFi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>Activity</Text>
        </TouchableOpacity>
      </View>

      {/* Token List */}
      {activeTab === 'tokens' && (
      <View style={styles.tokensSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Total assets</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>Manage →</Text>
          </TouchableOpacity>
        </View>
        
        {/* Mainstream Tokens (Fixed) */}
        {tokens.map((token, index) => (
          <TouchableOpacity 
            key={`main-${index}`}
            style={styles.tokenItem}
            onPress={() => navigation.navigate('TokenDetail', { token })}
          >
            <View style={styles.tokenLeft}>
              <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                {TokenLogoService.hasLogo(token.symbol) ? (
                  <Image 
                    source={TokenLogoService.getTokenLogo(token.symbol)} 
                    style={styles.tokenLogoImage}
                  />
                ) : (
                  <Text style={styles.tokenIconText}>{token.icon}</Text>
                )}
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>{token.symbol}</Text>
                <Text style={styles.tokenAmount}>{parseFloat(token.balanceFormatted).toFixed(4)}</Text>
              </View>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenValue}>≈ ${token.value}</Text>
              <Text style={styles.tokenChange}>+0.00%</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Custom Tokens (User Added) */}
        {customTokens.length > 0 && (
          <View style={styles.customTokensSection}>
            <Text style={styles.customTokensTitle}>Custom Tokens</Text>
            {customTokens.map((token, index) => (
              <TouchableOpacity 
                key={`custom-${index}`}
                style={styles.tokenItem}
                onPress={() => navigation.navigate('TokenDetail', { token })}
              >
                <View style={styles.tokenLeft}>
                  <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                    {TokenLogoService.hasLogo(token.symbol) ? (
                      <Image 
                        source={TokenLogoService.getTokenLogo(token.symbol)} 
                        style={styles.tokenLogoImage}
                      />
                    ) : (
                      <Text style={styles.tokenIconText}>{token.icon}</Text>
                    )}
                  </View>
                  <View style={styles.tokenInfo}>
                    <Text style={styles.tokenName}>{token.symbol}</Text>
                    <Text style={styles.tokenAmount}>{parseFloat(token.balanceFormatted).toFixed(4)}</Text>
                  </View>
                </View>
                <View style={styles.tokenRight}>
                  <Text style={styles.tokenValue}>≈ ${token.value}</Text>
                  <Text style={styles.tokenChange}>+0.00%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add Token Button */}
        <TouchableOpacity 
          style={styles.addTokenButton}
          onPress={() => navigation.navigate('AddToken')}
        >
          <Text style={styles.addTokenIcon}>+</Text>
          <Text style={styles.addTokenText}>Add Token</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* NFT Tab */}
      {activeTab === 'nft' && (
      <View style={styles.tokensSection}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🖼️</Text>
          <Text style={styles.emptyTitle}>No NFTs yet</Text>
          <Text style={styles.emptyDescription}>Your NFT collection will appear here</Text>
        </View>
      </View>
      )}

      {/* DeFi Tab */}
      {activeTab === 'defi' && (
      <View style={styles.tokensSection}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💎</Text>
          <Text style={styles.emptyTitle}>No DeFi positions</Text>
          <Text style={styles.emptyDescription}>Your DeFi investments will appear here</Text>
        </View>
      </View>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
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
      )}
    </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DAppBrowser')}>
          <Text style={styles.navIcon}>🌐</Text>
          <Text style={styles.navText}>Browser</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Send')}>
          <Text style={styles.navIcon}>💱</Text>
          <Text style={styles.navText}>Trade</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
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
  tokensSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: '600',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  tokenAmount: {
    fontSize: 13,
    color: '#666',
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  tokenChange: {
    fontSize: 12,
    color: '#999',
  },
  addTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  addTokenIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3BA2F',
    marginRight: 6,
  },
  addTokenText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F3BA2F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  transactionsSection: {
    padding: 20,
    paddingTop: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 2,
    opacity: 0.5,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 2,
  },
  navText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  navTextActive: {
    fontSize: 11,
    color: '#F3BA2F',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customTokensSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  customTokensTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
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
