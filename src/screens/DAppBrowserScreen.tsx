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
import { FEATURED_DAPPS, DAPP_CATEGORIES, getDAppsByCategory, searchDApps, DApp } from '../config/dappsConfig';
import WalletService from '../services/WalletService';

export default function DAppBrowserScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayDApps, setDisplayDApps] = useState<DApp[]>(FEATURED_DAPPS);

  useEffect(() => {
    filterDApps();
  }, [selectedCategory, searchQuery]);

  const filterDApps = () => {
    if (searchQuery.trim()) {
      const results = searchDApps(searchQuery);
      setDisplayDApps(results);
    } else {
      const filtered = getDAppsByCategory(selectedCategory);
      setDisplayDApps(filtered);
    }
  };

  const openDApp = (dapp: DApp) => {
    // Open in external browser with Web3 support
    Linking.openURL(dapp.url);
  };

  const renderDAppCard = (dapp: DApp) => (
    <TouchableOpacity
      style={styles.dappCard}
      onPress={() => openDApp(dapp)}
    >
      <View style={styles.dappIcon}>
        <Text style={styles.dappIconText}>{dapp.icon || '🌐'}</Text>
      </View>
      <View style={styles.dappInfo}>
        <Text style={styles.dappName}>{dapp.name}</Text>
        <Text style={styles.dappDescription} numberOfLines={1}>
          {dapp.description}
        </Text>
        <Text style={styles.dappCategory}>{dapp.category}</Text>
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
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search DApps..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
        {DAPP_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === category && styles.categoryTabTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView>
        {/* DApp List */}
        <View style={styles.section}>
          {displayDApps.map((dapp, index) => (
            <View key={index}>
              {renderDAppCard(dapp)}
            </View>
          ))}
          
          {displayDApps.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No DApps found</Text>
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
  categoryTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryTabActive: {
    backgroundColor: '#F3BA2F',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  dappCategory: {
    fontSize: 11,
    color: '#F3BA2F',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
