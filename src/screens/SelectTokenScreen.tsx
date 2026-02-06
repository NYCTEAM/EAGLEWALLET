/**
 * Eagle Wallet - Select Token Screen
 * Select which token to send
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

export default function SelectTokenScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { action, onSelect } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');

  const tokens = [
    { symbol: 'USDT', name: 'Tether USD', chain: 'BNB Chain', amount: '7,727.08', value: '$7,717.19', color: '#26A17B', icon: '💲' },
    { symbol: 'BNB', name: 'BNB', chain: 'BNB Chain', amount: '0.036739', value: '$22.99', color: '#F3BA2F', icon: 'B' },
    { symbol: 'USD1', name: 'World Liberty Financial USD', chain: 'BNB Chain', amount: '<0.01', value: '<$0.01', color: '#D4AF37', icon: '1' },
    { symbol: 'WBNB', name: 'Wrapped BNB', chain: 'BNB Chain', amount: '0.000001', value: '<$0.01', color: '#F3BA2F', icon: 'W' },
    { symbol: 'U', name: 'United Stables', chain: 'BNB Chain', amount: '0.000008', value: '<$0.01', color: '#333', icon: 'U' },
    { symbol: 'EAGLE', name: 'EAGLE', chain: 'BNB Chain', amount: '189', value: '$0.00', color: '#000', icon: 'E' },
  ];

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectToken = (token: any) => {
    if (onSelect) {
      onSelect(token);
      navigation.goBack();
    } else if (action === 'send') {
      navigation.navigate('EnterAddress', { token });
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.swap.selectToken}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t.token.searchToken}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Token List */}
      <ScrollView style={styles.tokenList}>
        {filteredTokens.map((token, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tokenItem}
            onPress={() => handleSelectToken(token)}
          >
            <View style={styles.tokenLeft}>
              <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                <Text style={styles.tokenIconText}>{token.icon}</Text>
              </View>
              <View style={styles.tokenInfo}>
                <View style={styles.tokenNameRow}>
                  <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                  <Text style={styles.tokenChain}>{token.chain}</Text>
                </View>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenAmount}>{token.amount}</Text>
              <Text style={styles.tokenValue}>{token.value}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  tokenList: {
    flex: 1,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  tokenChain: {
    fontSize: 12,
    color: '#999',
  },
  tokenName: {
    fontSize: 13,
    color: '#666',
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 13,
    color: '#999',
  },
});
