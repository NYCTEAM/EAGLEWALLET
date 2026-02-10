import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MultiWalletService from '../services/MultiWalletService';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

export default function WalletsScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);

  const loadWallets = useCallback(async () => {
    const [allWallets, activeWallet] = await Promise.all([
      MultiWalletService.getAllWallets(),
      MultiWalletService.getActiveWallet(),
    ]);

    setWallets(allWallets);
    setActiveWalletId(activeWallet?.id || null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWallets();
    }, [loadWallets])
  );

  const handleSwitchWallet = async (wallet: any) => {
    try {
      await MultiWalletService.switchWallet(wallet.id);

      if (wallet.type === 'watch') {
        await WalletService.setReadOnlyAddress(wallet.address);
        Alert.alert(t.common.success, t.wallet.switchSuccess.replace('{name}', wallet.name));
      } else {
        const instance = await MultiWalletService.getWalletInstance(wallet.id);
        if (!instance) {
          throw new Error(t.errors.notFound);
        }
        await WalletService.setActiveWalletFromPrivateKey(instance.privateKey);
        Alert.alert(t.common.success, t.wallet.switchSuccess.replace('{name}', wallet.name));
      }

      await loadWallets();
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.switchWalletFailed);
    }
  };

  const handleSetDefault = async (wallet: any) => {
    try {
      await MultiWalletService.setDefaultWallet(wallet.id);
      await loadWallets();
      Alert.alert(t.common.success, t.common.done);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    }
  };

  const handleDeleteWallet = async (wallet: any) => {
    Alert.alert(
      t.common.warning,
      `${t.wallet.deleteConfirmMessage}\n${wallet.name}`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await MultiWalletService.deleteWallet(wallet.id, '');
              await loadWallets();
            } catch (error: any) {
              Alert.alert(t.common.error, error?.message || t.errors.deleteWalletFailed);
            }
          },
        },
      ]
    );
  };

  const renderWallet = ({ item }: { item: any }) => {
    const isActive = item.id === activeWalletId;

    return (
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View>
            <Text style={styles.walletName}>{item.name}</Text>
            <Text style={styles.walletAddress}>{item.address}</Text>
          </View>
          <View style={styles.badges}>
            {isActive ? <Text style={styles.activeBadge}>{t.wallet.activeWallet}</Text> : null}
            {item.isDefault ? <Text style={styles.defaultBadge}>{t.network.selected}</Text> : null}
            {item.type === 'watch' ? <Text style={styles.watchBadge}>WATCH</Text> : null}
          </View>
        </View>

        <View style={styles.actions}>
          {!isActive ? (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleSwitchWallet(item)}>
              <Text style={styles.actionText}>{t.common.select}</Text>
            </TouchableOpacity>
          ) : null}

          {!item.isDefault ? (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleSetDefault(item)}>
              <Text style={styles.actionText}>{t.common.save}</Text>
            </TouchableOpacity>
          ) : null}

          {item.type !== 'watch' ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('ExportPrivateKey', {
                  walletId: item.id,
                  walletName: item.name,
                })
              }
            >
              <Text style={styles.actionText}>{t.settings.exportPrivateKey}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteWallet(item)}>
            <Text style={[styles.actionText, styles.deleteText]}>{t.common.delete}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.wallet.myWallets}</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        renderItem={renderWallet}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>{t.home.noTokens}</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddWallet')}>
        <Text style={styles.addButtonText}>{t.common.add} {t.wallet.myWallets}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
  },
  back: {
    color: '#E9B949',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  walletCard: {
    backgroundColor: '#1A1D29',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  walletName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  walletAddress: {
    color: '#9DA4BA',
    fontSize: 12,
    maxWidth: 220,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  activeBadge: {
    color: '#0B1A11',
    backgroundColor: '#3ED598',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: '700',
  },
  defaultBadge: {
    color: '#2A1A00',
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: '700',
  },
  watchBadge: {
    color: '#FFFFFF',
    backgroundColor: '#425071',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: {
    color: '#D8DEEE',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#5C2930',
  },
  deleteText: {
    color: '#FF9BA8',
  },
  emptyText: {
    color: '#9DA4BA',
    textAlign: 'center',
    marginTop: 40,
  },
  addButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#E9B949',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#191919',
    fontSize: 15,
    fontWeight: '700',
  },
});
