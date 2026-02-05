/**
 * Eagle Wallet - DApp Browser Screen
 * Browse and access decentralized applications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import DAppService, { DApp } from '../services/DAppService';
import WalletService from '../services/WalletService';

export default function DAppBrowserScreen({ navigation }: any) {
  const [featuredDApps, setFeaturedDApps] = useState<DApp[]>([]);
  const [recentDApps, setRecentDApps] = useState<DApp[]>([]);
  const [customDApps, setCustomDApps] = useState<DApp[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DApp[]>([]);
  const [currentChain, setCurrentChain] = useState(56);

  useEffect(() => {
    loadDApps();
  }, []);

  const loadDApps = () => {
    const network = WalletService.getCurrentNetwork();
    setCurrentChain(network.chainId);
    setFeaturedDApps(DAppService.getFeaturedDApps(network.chainId));
    setRecentDApps(DAppService.getRecentDApps());
    setCustomDApps(DAppService.getCustomDApps());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = DAppService.searchDApps(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const openDApp = (dapp: DApp) => {
    DAppService.addToRecent(dapp);
    setRecentDApps(DAppService.getRecentDApps());
    
    // Open in external browser with Web3 support
    Linking.openURL(dapp.url);
  };

  const openCustomURL = () => {
    if (DAppService.isValidUrl(searchQuery)) {
      const customDApp: DApp = {
        id: `temp-${Date.now()}`,
        name: 'Custom DApp',
        url: searchQuery,
        icon: '🌐',
        description: 'Custom URL',
        category: 'other',
        chainId: currentChain,
      };
      openDApp(customDApp);
    }
  };

  const renderDAppCard = (dapp: DApp, showChain: boolean = false) => (
    <TouchableOpacity
      key={dapp.id}
      style={styles.dappCard}
      onPress={() => openDApp(dapp)}
    >
      <View style={styles.dappIcon}>
        <Text style={styles.dappIconText}>{dapp.icon}</Text>
      </View>
      <View style={styles.dappInfo}>
        <Text style={styles.dappName}>{dapp.name}</Text>
        <Text style={styles.dappDescription} numberOfLines={1}>
          {dapp.description}
        </Text>
        {showChain && (
          <Text style={styles.dappChain}>
            {dapp.chainId === 56 ? '🟡 BSC' : '🔷 XLAYER'}
          </Text>
        )}
      </View>
      <Text style={styles.dappArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>DApp Browser</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddDApp')}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search DApps or enter URL..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {DAppService.isValidUrl(searchQuery) && (
          <TouchableOpacity style={styles.goButton} onPress={openCustomURL}>
            <Text style={styles.goButtonText}>Go</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView>
        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map(dapp => renderDAppCard(dapp, true))}
          </View>
        )}

        {/* Recent DApps */}
        {!searchQuery && recentDApps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recentDApps.slice(0, 5).map(dapp => renderDAppCard(dapp))}
          </View>
        )}

        {/* Featured DApps */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Featured on {currentChain === 56 ? 'BSC' : 'XLAYER'}
            </Text>
            {featuredDApps.map(dapp => renderDAppCard(dapp))}
          </View>
        )}

        {/* Categories */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => navigation.navigate('DAppCategory', { category: 'defi' })}
              >
                <Text style={styles.categoryIcon}>💰</Text>
                <Text style={styles.categoryName}>DeFi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => navigation.navigate('DAppCategory', { category: 'nft' })}
              >
                <Text style={styles.categoryIcon}>🎨</Text>
                <Text style={styles.categoryName}>NFT</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => navigation.navigate('DAppCategory', { category: 'game' })}
              >
                <Text style={styles.categoryIcon}>🎮</Text>
                <Text style={styles.categoryName}>Games</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => navigation.navigate('DAppCategory', { category: 'social' })}
              >
                <Text style={styles.categoryIcon}>👥</Text>
                <Text style={styles.categoryName}>Social</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Custom DApps */}
        {!searchQuery && customDApps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My DApps</Text>
            {customDApps.map(dapp => renderDAppCard(dapp))}
          </View>
        )}

        {/* Quick Links */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Links</Text>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => Linking.openURL('https://bscscan.com')}
            >
              <Text style={styles.quickLinkIcon}>🔍</Text>
              <Text style={styles.quickLinkText}>BSCScan Explorer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => Linking.openURL('https://www.oklink.com/xlayer')}
            >
              <Text style={styles.quickLinkIcon}>🔍</Text>
              <Text style={styles.quickLinkText}>XLAYER Explorer</Text>
            </TouchableOpacity>
          </View>
        )}
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
  addButton: {
    fontSize: 32,
    color: '#F3BA2F',
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  goButton: {
    marginLeft: 12,
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  goButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  dappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dappIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dappIconText: {
    fontSize: 24,
  },
  dappInfo: {
    flex: 1,
  },
  dappName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  dappDescription: {
    fontSize: 12,
    color: '#666',
  },
  dappChain: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  dappArrow: {
    fontSize: 20,
    color: '#999',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickLinkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  quickLinkText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
});
