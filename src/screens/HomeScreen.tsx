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
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import WalletService from '../services/WalletService';
import TokenService from '../services/TokenService';
import CustomTokenService from '../services/CustomTokenService';
import TokenLogoService from '../services/TokenLogoService';
import MultiWalletService from '../services/MultiWalletService';
import { NETWORKS } from '../config/networks';
import { getChainTokens } from '../config/tokenConfig';

// Network icons
const NETWORK_ICONS: Record<number, any> = {
  56: require('../assets/tokens/bnb.png'),
  196: require('../assets/tokens/okb.png'),
};

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
  
  // New state for selectors
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [currentWallet, setCurrentWallet] = useState<any>(null);
  
  // Wallet creation state
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [importType, setImportType] = useState<'create' | 'mnemonic' | 'privateKey'>('create');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const addr = await WalletService.getAddress();
      
      // Load multi-wallet data
      const allWallets = await MultiWalletService.getAllWallets();
      setWallets(allWallets);
      const active = await MultiWalletService.getActiveWallet();
      setCurrentWallet(active);

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

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await WalletService.switchNetwork(chainId);
      await loadWalletData();
      setShowNetworkModal(false);
    } catch (error) {
      console.error('Switch network error:', error);
    }
  };

  const handleSwitchWallet = async (wallet: any) => {
    try {
      await MultiWalletService.switchWallet(wallet.id);
      // In a real app, we would handle password prompt here
      // For now, we assume the wallet is unlocked or we use the cached password
      await loadWalletData();
      setShowWalletModal(false);
    } catch (error) {
      console.error('Switch wallet error:', error);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '...';
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
        <TouchableOpacity onPress={() => setShowWalletModal(true)} style={styles.walletSelector}>
          <Image 
            source={require('../assets/tokens/eagle.png')}
            style={styles.logoImage}
          />
          <View>
            <Text style={styles.walletName}>{currentWallet?.name || 'My Wallet'}</Text>
            <Text style={styles.walletAddress}>{formatAddress(address)} ▼</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowNetworkModal(true)} style={styles.networkButton}>
          <Image source={NETWORK_ICONS[network.chainId]} style={styles.networkButtonIcon} />
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

      {/* Network Selector Modal */}
      <Modal
        visible={showNetworkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowNetworkModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Network</Text>
            
            <TouchableOpacity 
              style={[styles.networkOption, network.chainId === 56 && styles.selectedOption]}
              onPress={() => handleSwitchNetwork(56)}
            >
              <Image source={NETWORK_ICONS[56]} style={styles.networkOptionIcon} />
              <Text style={styles.networkOptionText}>BNB Smart Chain</Text>
              {network.chainId === 56 && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.networkOption, network.chainId === 196 && styles.selectedOption]}
              onPress={() => handleSwitchNetwork(196)}
            >
              <Image source={NETWORK_ICONS[196]} style={styles.networkOptionIcon} />
              <Text style={styles.networkOptionText}>X Layer</Text>
              {network.chainId === 196 && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Wallet Selector Modal */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.walletModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Wallet</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.walletList}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[styles.walletOption, currentWallet?.id === wallet.id && styles.selectedOption]}
                  onPress={() => handleSwitchWallet(wallet)}
                >
                  <View style={[styles.walletAvatar, { backgroundColor: wallet.color || '#F3BA2F' }]}>
                    <Text style={styles.walletAvatarText}>
                      {wallet.name ? wallet.name.charAt(0).toUpperCase() : 'W'}
                    </Text>
                  </View>
                  <View style={styles.walletDetails}>
                    <Text style={styles.walletNameText}>{wallet.name}</Text>
                    <Text style={styles.walletAddressText}>{formatAddress(wallet.address)}</Text>
                  </View>
                  {currentWallet?.id === wallet.id && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.walletActions}>
              <TouchableOpacity 
                style={styles.addWalletButton}
                onPress={() => {
                  setShowWalletModal(false);
                  navigation.navigate('Wallets');
                }}
              >
                <Text style={styles.addWalletText}>Manage / Add Wallets</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
  },
  walletName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  walletAddress: {
    fontSize: 11,
    color: '#666',
  },
  networkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  networkButtonIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    borderRadius: 10,
  },
  networkText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  walletModalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedOption: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#F3BA2F',
  },
  networkOptionIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 16,
  },
  networkOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  checkMark: {
    fontSize: 18,
    color: '#F3BA2F',
    fontWeight: 'bold',
  },
  walletList: {
    maxHeight: 400,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  walletAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  walletDetails: {
    flex: 1,
  },
  walletNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  walletAddressText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  walletActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  addWalletButton: {
    backgroundColor: '#F3BA2F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addWalletText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
