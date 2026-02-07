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
import PriceService from '../services/PriceService';
import { useLanguage } from '../i18n/LanguageContext';
import { NETWORKS } from '../config/networks';
import { getChainTokens, TokenConfig } from '../config/tokenConfig';
import NFTService, { NFT } from '../services/NFTService';
import { ethers } from 'ethers';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, isTabScreen }: any) {
  console.log('🏠 HomeScreen: Component rendering');
  const { t } = useLanguage();
  const [balance, setBalance] = useState('0.0000');
  const [address, setAddress] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [walletName, setWalletName] = useState('Main Wallet');
  const [tokens, setTokens] = useState<any[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [activeTab, setActiveTab] = useState<'crypto' | 'nft'>('crypto');
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

      // Load NFTs
      console.log('🖼️ Loading NFTs...');
      if (addr) {
        const userNFTs = await NFTService.getUserNFTs(addr, currentNet.chainId);
        setNfts(userNFTs);
        console.log(`✅ Loaded ${userNFTs.length} NFTs`);
      }

      // Load predefined mainstream tokens for current chain
      const chainTokens = getChainTokens(currentNet.chainId);
      console.log(`📦 Loading ${chainTokens.length} predefined tokens for ${currentNet.name}`);
      
      // Get provider for balance queries
      const provider = await WalletService.getProvider();
      
      // Build token list with native token first
      const tokenList: any[] = [
        { 
          symbol: currentNet.symbol, 
          name: currentNet.name, 
          balance: formattedBal, 
          price: 0, 
          change: 0, 
          address: 'native',
          logo: currentNet.symbol.toLowerCase(),
        },
      ];
      
      // Load balances for predefined tokens
      for (const token of chainTokens) {
        let balance = '0.0000';
        
        try {
          // ERC20 ABI for balanceOf
          const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
          const contract = new ethers.Contract(token.address, erc20Abi, provider);
          
          const tokenBalance = await contract.balanceOf(addr);
          balance = ethers.formatUnits(tokenBalance, token.decimals);
        } catch (error) {
          console.warn(`Failed to load balance for ${token.symbol}, showing as 0:`, error);
        }

        // Add token regardless of balance or error
        tokenList.push({
          symbol: token.symbol,
          name: token.name,
          balance: parseFloat(balance).toFixed(4),
          price: 0,
          change: 0,
          address: token.address,
          logo: token.logo || token.symbol.toLowerCase(),
          color: token.color,
          decimals: token.decimals,
        });
      }
      
      setTokens(tokenList);
      console.log(`✅ Loaded ${tokenList.length} tokens (including native)`);
      
      // Fetch prices for all tokens using contract addresses
      console.log('💰 Fetching token prices...');
      const tokenAddresses = tokenList.map(t => t.address);
      const priceData = await PriceService.getTokenPricesWithChange(tokenAddresses, currentNet.chainId);
      
      // Update token list with prices
      const tokensWithPrices = tokenList.map(token => {
        const data = priceData[token.address.toLowerCase()] || { price: 0, change24h: 0 };
        const value = parseFloat(token.balance) * data.price;
        
        return {
          ...token,
          price: data.price,
          change: data.change24h,
          value: value.toFixed(2),
        };
      });
      
      setTokens(tokensWithPrices);
      console.log(`💰 Prices loaded for ${Object.keys(priceData).length} tokens`);

    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing token data...');
        loadData();
      }, 30000);
      
      return () => clearInterval(interval);
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
          {!isTabScreen && (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('DAppBrowser')}>
                <Text style={styles.iconButton}>🌐</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.iconButton}>⚙️</Text>
              </TouchableOpacity>
            </>
          )}
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

        {/* Tokens / NFT List */}
        <View style={styles.tokensContainer}>
          <View style={styles.tabsHeader}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'crypto' && styles.activeTabButton]}
                onPress={() => setActiveTab('crypto')}
              >
                <Text style={[styles.tabText, activeTab === 'crypto' && styles.activeTabText]}>{t.home.tokens}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'nft' && styles.activeTabButton]}
                onPress={() => setActiveTab('nft')}
              >
                <Text style={[styles.tabText, activeTab === 'nft' && styles.activeTabText]}>NFTs</Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'crypto' && (
              <TouchableOpacity onPress={() => navigation.navigate('AddToken')}>
                <Text style={styles.addTokenText}>+ {t.common.add}</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTab === 'crypto' ? (
            <>
              {tokens.map((token, index) => {
                const tokenLogo = TokenLogoService.getTokenLogo(token.logo || token.symbol);
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.tokenItem}
                    onPress={() => navigation.navigate('TokenDetail', { token })}
                  >
                    {/* Token Logo */}
                    {tokenLogo ? (
                      <Image source={tokenLogo} style={styles.tokenLogoImage} />
                    ) : (
                      <View style={[styles.tokenIcon, { backgroundColor: token.color || '#333' }]}>
                        <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
                      </View>
                    )}
                    
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                      <Text style={styles.tokenBalanceAmount}>{token.balance}</Text>
                    </View>
                    <View style={styles.tokenRight}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.tokenPrice}>
                          ${token.price > 0 
                            ? (token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(2)) 
                            : '0.00'}
                        </Text>
                        {token.change !== 0 && (
                          <Text style={[
                            styles.tokenChange,
                            { color: token.change >= 0 ? '#43A047' : '#E53935' }
                          ]}>
                            {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
                          </Text>
                        )}
                      </View>
                      <Text style={styles.tokenValueSmall}>
                        ${token.value && parseFloat(token.value) > 0 ? token.value : '0.00'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => navigation.navigate('AddToken')}
              >
                 <Text style={styles.manageButtonText}>{t.home.manageAddWallets}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.nftGrid}>
              {nfts.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {nfts.map((nft, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.nftCard}
                      onPress={() => navigation.navigate('NFTDetail', { nft })}
                    >
                      <Image 
                        source={{ uri: nft.image }} 
                        style={styles.nftImage} 
                        resizeMode="cover"
                      />
                      <View style={styles.nftInfo}>
                        <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
                        <Text style={styles.nftId}>#{nft.tokenId}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyNftState}>
                  <Text style={styles.emptyNftIcon}>🖼️</Text>
                  <Text style={styles.emptyNftText}>No NFTs found</Text>
                </View>
              )}
            </View>
          )}
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
  },
  tokensHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tabsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
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
  nftGrid: {
    paddingBottom: 20,
  },
  nftCard: {
    width: (width - 60) / 2,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  nftImage: {
    width: '100%',
    height: (width - 60) / 2,
    backgroundColor: '#333',
  },
  nftInfo: {
    padding: 10,
  },
  nftName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nftId: {
    color: '#999',
    fontSize: 12,
  },
  emptyNftState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNftIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyNftText: {
    color: '#999',
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
  tokenLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  tokenIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenBalanceAmount: {
    color: '#999',
    fontSize: 13,
  },
  tokenRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  tokenValueSmall: {
    color: '#999',
    fontSize: 13,
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
