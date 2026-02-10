/**
 * Eagle Wallet - Select Token Screen
 * Select which token to send
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Alert,
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
import CustomTokenService from '../services/CustomTokenService';
import { ethers } from 'ethers';

export default function SelectTokenScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { action, onSelect } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [networkName, setNetworkName] = useState('BNB Chain');
  const [importingCustom, setImportingCustom] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    const network = WalletService.getCurrentNetwork();
    setNetworkName(network.name);
    
    // Get predefined + custom ERC20 tokens
    const chainTokens = getChainTokens(network.chainId);
    const customTokens = (await CustomTokenService.getCustomTokensByChain(network.chainId))
      .filter((token) => token.type === 'ERC20')
      .map((token) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: token.logo || token.symbol.toLowerCase(),
        color: '#4C6FFF',
        isCustom: true,
      }));
    const address = await WalletService.getAddress();
    const provider = await WalletService.getProvider();

    const mergedTokensMap = new Map<string, any>();
    [...chainTokens, ...customTokens].forEach((token) => {
      const key = token.address.toLowerCase();
      if (!mergedTokensMap.has(key)) {
        mergedTokensMap.set(key, token);
      }
    });
    const mergedTokens = Array.from(mergedTokensMap.values());
    
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
    
    const formattedTokens = await Promise.all(
      mergedTokens.map(async (token) => {
        let tokenBalance = '0.00';
        if (address) {
          try {
            const erc20 = new ethers.Contract(
              token.address,
              ['function balanceOf(address owner) view returns (uint256)'],
              provider
            );
            const raw = await erc20.balanceOf(address);
            tokenBalance = parseFloat(ethers.formatUnits(raw, token.decimals ?? 18)).toFixed(4);
          } catch {
            tokenBalance = '0.00';
          }
        }

        return {
          ...token,
          balance: tokenBalance,
          value: '$0.00',
        };
      })
    );
    
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

  const handleImportCustom = async () => {
      if (!isAddress(searchQuery)) {
        return;
      }

      setImportingCustom(true);
      try {
        const network = WalletService.getCurrentNetwork();
        const provider = await WalletService.getProvider();
        const token = await CustomTokenService.getTokenInfo(searchQuery.trim(), network.chainId, provider);

        if (token.type !== 'ERC20') {
          throw new Error(t.token.invalidTokenAddress);
        }

        try {
          await CustomTokenService.addCustomToken(token);
        } catch (error: any) {
          const message = String(error?.message || '');
          if (!message.toLowerCase().includes('already added')) {
            throw error;
          }
        }

        const selectedToken = {
          ...token,
          balance: '0.00',
          value: '$0.00',
          color: '#4C6FFF',
        };

        // Update in-memory list immediately for current session
        setTokens((prev) => {
          const exists = prev.some((item) => item.address.toLowerCase() === selectedToken.address.toLowerCase());
          if (exists) {
            return prev;
          }
          // Keep native token at index 0
          if (prev.length > 0 && prev[0].address === 'native') {
            return [prev[0], selectedToken, ...prev.slice(1)];
          }
          return [selectedToken, ...prev];
        });

        handleSelectToken(selectedToken);
      } catch (error: any) {
        const message = error?.message || t.errors.unknownError;
        const mapped = String(message).toLowerCase().includes('already added')
          ? t.token.tokenAlreadyAdded
          : message;
        Alert.alert(t.common.error, mapped);
      } finally {
        setImportingCustom(false);
      }
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
                    <Text style={styles.tokenSymbol}>{importingCustom ? t.common.loading : t.token.importToken}</Text>
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
