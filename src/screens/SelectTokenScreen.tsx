/**
 * Eagle Wallet - Select Token Screen
 * Select which token to send
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { getChainTokens, TokenConfig } from '../config/tokenConfig';
import WalletService from '../services/WalletService';
import TokenLogoService from '../services/TokenLogoService';
import { ethers } from 'ethers';

export default function SelectTokenScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { action, onSelect } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [networkName, setNetworkName] = useState('BNB Chain');

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    const network = WalletService.getCurrentNetwork();
    setNetworkName(network.name);
    
    // Get predefined tokens
    const chainTokens = getChainTokens(network.chainId);
    const address = await WalletService.getAddress();
    
    // Add native token
    const nativeToken = {
        symbol: network.symbol,
        name: network.name,
        address: 'native', // Use 'native' or ZeroAddress consistently
        decimals: 18,
        logo: network.symbol.toLowerCase(),
        balance: '0.00',
        value: '$0.00',
        color: '#F3BA2F'
    };
    
    // Load balances (simplified, maybe optimize later)
    // For now just load list to show UI
    const formattedTokens = chainTokens.map(token => ({
        ...token,
        balance: '0.00', // Placeholder
        value: '$0.00'
    }));
    
    setTokens([nativeToken, ...formattedTokens]);
  };

  const isAddress = (query: string) => {
    return ethers.isAddress(query);
  };

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase() === searchQuery.toLowerCase()
  );

  // If search is an address and not found, show option to import
  const showImport = isAddress(searchQuery) && filteredTokens.length === 0;

  const handleSelectToken = (token: any) => {
    // If selecting native token, ensure address format is what SwapScreen expects (ZeroAddress)
    // SwapService expects '0x000...' for native in some checks, but 'native' string in others?
    // Let's use ZeroAddress for consistency with standard DApps
    const selectedToken = {
        ...token,
        address: token.address === 'native' ? ethers.ZeroAddress : token.address
    };

    if (onSelect) {
      onSelect(selectedToken);
      navigation.goBack();
    } else if (action === 'send') {
      navigation.navigate('EnterAddress', { token: selectedToken });
    } else {
      navigation.goBack();
    }
  };

  const handleImportCustom = () => {
      // Create a temporary custom token object
      // In a real app, we would fetch metadata (symbol, decimals) from chain
      const customToken = {
          symbol: 'UNKNOWN',
          name: 'Custom Token',
          address: searchQuery,
          decimals: 18,
          logo: null,
          isCustom: true
      };
      handleSelectToken(customToken);
  };

  const renderTokenIcon = (token: any) => {
    // Check for remote URL
    if (token.logo && token.logo.startsWith('http')) {
        return <Image source={{ uri: token.logo }} style={styles.tokenLogoImage} />;
    }

    // Check local asset
    const logoSource = TokenLogoService.getTokenLogo(token.logo || token.symbol);
    if (logoSource) {
        return <Image source={logoSource} style={styles.tokenLogoImage} />;
    }

    // Fallback text
    return (
        <View style={[styles.tokenIcon, { backgroundColor: token.color || '#333' }]}>
            <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
        </View>
    );
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
        {showImport && (
             <TouchableOpacity style={styles.tokenItem} onPress={handleImportCustom}>
                <View style={[styles.tokenIcon, { backgroundColor: '#666' }]}>
                    <Text style={styles.tokenIconText}>?</Text>
                </View>
                <View style={styles.tokenInfo}>
                    <Text style={styles.tokenSymbol}>Import Token</Text>
                    <Text style={styles.tokenName}>{searchQuery}</Text>
                </View>
             </TouchableOpacity>
        )}
        
        {filteredTokens.map((token, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tokenItem}
            onPress={() => handleSelectToken(token)}
          >
            <View style={styles.tokenLeft}>
              {renderTokenIcon(token)}
              <View style={styles.tokenInfo}>
                <View style={styles.tokenNameRow}>
                  <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                  <Text style={styles.tokenChain}>{networkName}</Text>
                </View>
                <Text style={styles.tokenName}>{token.name}</Text>
              </View>
            </View>
            <View style={styles.tokenRight}>
              <Text style={styles.tokenAmount}>{token.balance}</Text>
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
  tokenLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
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
