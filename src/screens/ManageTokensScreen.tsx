import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../i18n/LanguageContext';
import WalletService from '../services/WalletService';
import CustomTokenService from '../services/CustomTokenService';
import TokenLogoService from '../services/TokenLogoService';
import TokenVisibilityService from '../services/TokenVisibilityService';
import { getChainTokens } from '../config/tokenConfig';

export default function ManageTokensScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<any[]>([]);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const network = WalletService.getCurrentNetwork();
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

      const merged = new Map<string, any>();
      [...chainTokens, ...customTokens].forEach((token) => {
        const key = token.address.toLowerCase();
        if (!merged.has(key)) {
          merged.set(key, token);
        }
      });

      const list = [
        {
          symbol: network.symbol,
          name: network.name,
          address: 'native',
          logo: network.symbol.toLowerCase(),
          color: '#F3BA2F',
        },
        ...Array.from(merged.values()).map((token) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          logo: token.logo || token.symbol.toLowerCase(),
          color: token.color,
          isCustom: token.isCustom,
        })),
      ];

      const eagleIndex = list.findIndex((token) => String(token.symbol || '').toUpperCase() === 'EAGLE');
      if (eagleIndex > -1) {
        const [eagleToken] = list.splice(eagleIndex, 1);
        list.unshift(eagleToken);
      }

      setTokens(list);
      const hidden = await TokenVisibilityService.getHiddenTokens(network.chainId);
      setHiddenKeys(hidden);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTokens();
    }, [loadTokens])
  );

  const hiddenSet = useMemo(() => new Set(hiddenKeys.map((key) => key.toLowerCase())), [hiddenKeys]);

  const isEagleToken = (token: any) => {
    const symbol = String(token.symbol || '').toUpperCase();
    return symbol === 'EAGLE';
  };

  const toggleToken = async (token: any) => {
    if (isEagleToken(token)) return;
    const network = WalletService.getCurrentNetwork();
    const tokenKey = TokenVisibilityService.getTokenKey(token);
    if (!tokenKey) return;
    const hidden = hiddenSet.has(tokenKey.toLowerCase());
    await TokenVisibilityService.setTokenHidden(network.chainId, tokenKey, !hidden);
    const next = new Set(hiddenSet);
    if (hidden) {
      next.delete(tokenKey.toLowerCase());
    } else {
      next.add(tokenKey.toLowerCase());
    }
    setHiddenKeys(Array.from(next));
  };

  const renderItem = ({ item }: { item: any }) => {
    const tokenKey = TokenVisibilityService.getTokenKey(item);
    const hidden = tokenKey ? hiddenSet.has(tokenKey.toLowerCase()) : false;
    const isEagle = isEagleToken(item);
    const logoSource = item.logo && item.logo.startsWith('http')
      ? { uri: item.logo }
      : TokenLogoService.getTokenLogo(item.logo || item.symbol);

    return (
      <View style={styles.tokenItem}>
        {logoSource ? (
          <Image source={logoSource} style={styles.tokenLogo} />
        ) : (
          <View style={[styles.tokenIcon, { backgroundColor: item.color || '#333' }]}>
            <Text style={styles.tokenIconText}>{item.symbol?.[0]}</Text>
          </View>
        )}

        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
          <Text style={styles.tokenName}>{item.name}</Text>
        </View>

        <View style={styles.tokenRight}>
          {isEagle ? (
            <View style={styles.lockBadge}>
              <Icon name="lock" size={14} color="#F3BA2F" />
            </View>
          ) : (
            <Switch
              value={!hidden}
              onValueChange={() => toggleToken(item)}
              trackColor={{ false: '#3A3A3A', true: '#F3BA2F' }}
              thumbColor={hidden ? '#666' : '#111'}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.token.tokens}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddToken')}>
          <Text style={styles.add}>{`+ ${t.common.add}`}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#F3BA2F" />
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={tokens}
          keyExtractor={(item, index) => `${item.address || item.symbol}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  back: {
    color: '#F3BA2F',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  add: {
    color: '#F3BA2F',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tokenName: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  tokenRight: {
    paddingLeft: 10,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(243,186,47,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 8,
    fontSize: 12,
  },
});
