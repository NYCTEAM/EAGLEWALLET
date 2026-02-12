import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import DAppService, { DApp } from '../services/DAppService';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

const RECENT_DAPPS_KEY = 'EAGLE_RECENT_DAPPS';
const EAGLE_LOGO = require('../assets/tokens/eagle.png');

export default function DAppBrowserScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [allDapps, setAllDapps] = useState<DApp[]>([]);
  const [recentDapps, setRecentDapps] = useState<DApp[]>([]);

  const loadDapps = useCallback(async () => {
    const network = WalletService.getCurrentNetwork();
    const featured = DAppService.getDAppsForChain(network.chainId);

    const recentRaw = await AsyncStorage.getItem(RECENT_DAPPS_KEY);
    const recent = recentRaw ? (JSON.parse(recentRaw) as DApp[]) : [];
    const allowedIds = new Set(featured.map((item) => item.id));
    const chainRecent = recent.filter(
      (item) => item.chainId === network.chainId && allowedIds.has(item.id)
    );

    setAllDapps(featured);
    setRecentDapps(chainRecent);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDapps();
    }, [loadDapps])
  );

  const isAutoConnectHost = (url: string) => {
    try {
      const host = new URL(url).host.toLowerCase();
      return (
        host === 'eagleswap.io' ||
        host.endsWith('.eagleswap.io') ||
        host === 'eagleswap.llc' ||
        host.endsWith('.eagleswap.llc') ||
        host === 'ai.eagleswaps.com' ||
        host.endsWith('.ai.eagleswaps.com')
      );
    } catch {
      return false;
    }
  };

  const openDapp = async (dapp: DApp) => {
    const deduped = [dapp, ...recentDapps.filter((item) => item.id !== dapp.id)].slice(0, 12);
    setRecentDapps(deduped);
    await AsyncStorage.setItem(RECENT_DAPPS_KEY, JSON.stringify(deduped));

    navigation.navigate('DAppWebView', {
      title: dapp.name,
      url: dapp.url,
      autoConnect: isAutoConnectHost(dapp.url),
    });
  };

  const filteredDapps = useMemo(() => {
    if (!query.trim()) {
      return allDapps;
    }

    const lower = query.trim().toLowerCase();
    return allDapps.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.url.toLowerCase().includes(lower)
    );
  }, [allDapps, query]);

  const renderDapp = ({ item }: { item: DApp }) => {
    const isEagle = item.icon === 'eagle' || item.id.startsWith('eagleswap');
    return (
    <TouchableOpacity style={styles.dappCard} onPress={() => openDapp(item)}>
      <View style={styles.iconBox}>
        {isEagle ? (
          <Image source={EAGLE_LOGO} style={styles.logo} />
        ) : (
          <Text style={styles.iconText}>{item.icon?.[0] || item.name[0]}</Text>
        )}
      </View>
      <View style={styles.dappInfo}>
        <Text style={styles.dappName}>{item.name}</Text>
        <Text style={styles.dappDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.dappUrl} numberOfLines={1}>{item.url}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isTabScreen ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{t.common.back}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={styles.title}>{t.dapp.dappBrowser}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t.dapp.searchPlaceholder}
          placeholderTextColor="#8F97AD"
        />
      </View>

      {!query.trim() && recentDapps.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dapp.recentlyVisited}</Text>
          <FlatList
            data={recentDapps}
            keyExtractor={(item) => `recent-${item.id}`}
            renderItem={renderDapp}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{query.trim() ? t.common.search : t.dapp.popularDApps}</Text>
        <FlatList
          data={filteredDapps}
          keyExtractor={(item) => item.id}
          renderItem={renderDapp}
          contentContainerStyle={styles.mainList}
          ListEmptyComponent={<Text style={styles.empty}>{t.dapp.noDApps}</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1017',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2535',
  },
  back: {
    color: '#E9B949',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  add: {
    color: '#E9B949',
    fontWeight: '700',
    fontSize: 14,
  },
  searchWrap: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    color: '#DCE2F1',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  recentList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  mainList: {
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  dappCard: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 10,
    minWidth: 290,
    marginRight: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#283151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  dappInfo: {
    flex: 1,
  },
  dappName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  dappDesc: {
    color: '#A6AEC3',
    fontSize: 12,
    marginBottom: 4,
  },
  dappUrl: {
    color: '#7D85A0',
    fontSize: 11,
  },
  empty: {
    color: '#8F97AD',
    textAlign: 'center',
    marginTop: 30,
  },
});
