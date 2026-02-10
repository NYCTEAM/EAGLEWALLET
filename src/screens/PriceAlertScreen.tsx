import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PriceAlertService, { PriceAlert } from '../services/PriceAlertService';
import WalletService from '../services/WalletService';
import { getChainTokens } from '../config/tokenConfig';
import { useLanguage } from '../i18n/LanguageContext';

export default function PriceAlertScreen({ navigation }: any) {
  const { t } = useLanguage();
  const network = WalletService.getCurrentNetwork();

  const tokenCandidates = useMemo(() => {
    const native = {
      symbol: network.symbol,
      address: 'native',
    };
    return [native, ...getChainTokens(network.chainId).map((item) => ({ symbol: item.symbol, address: item.address }))];
  }, [network.chainId, network.symbol]);

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [tokenSymbol, setTokenSymbol] = useState(tokenCandidates[0]?.symbol || network.symbol);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const loadAlerts = useCallback(async () => {
    const list = await PriceAlertService.getAllAlerts();
    setAlerts(list.filter((item) => item.chainId === network.chainId));
  }, [network.chainId]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  const createAlert = async () => {
    const value = Number(targetPrice);
    if (!tokenSymbol || !value || value <= 0) {
      Alert.alert(t.common.error, t.errors.invalidAmount);
      return;
    }

    const token = tokenCandidates.find((item) => item.symbol.toLowerCase() === tokenSymbol.toLowerCase());
    if (!token) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    await PriceAlertService.createAlert({
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      targetPrice: value,
      condition,
      isActive: true,
      chainId: network.chainId,
    });

    setTargetPrice('');
    await loadAlerts();
  };

  const removeAlert = async (id: string) => {
    await PriceAlertService.deleteAlert(id);
    await loadAlerts();
  };

  const toggleAlert = async (item: PriceAlert) => {
    await PriceAlertService.updateAlert(item.id, { isActive: !item.isActive });
    await loadAlerts();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.priceAlerts}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Token Symbol</Text>
        <TextInput
          style={styles.input}
          value={tokenSymbol}
          onChangeText={setTokenSymbol}
          placeholder="BNB"
          placeholderTextColor="#8F97AD"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Target Price (USD)</Text>
        <TextInput
          style={styles.input}
          value={targetPrice}
          onChangeText={setTargetPrice}
          placeholder="100"
          keyboardType="decimal-pad"
          placeholderTextColor="#8F97AD"
        />

        <View style={styles.conditionRow}>
          <TouchableOpacity
            style={[styles.conditionButton, condition === 'above' && styles.conditionButtonActive]}
            onPress={() => setCondition('above')}
          >
            <Text style={[styles.conditionText, condition === 'above' && styles.conditionTextActive]}>{t.priceAlert.above}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.conditionButton, condition === 'below' && styles.conditionButtonActive]}
            onPress={() => setCondition('below')}
          >
            <Text style={[styles.conditionText, condition === 'below' && styles.conditionTextActive]}>{t.priceAlert.below}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={createAlert}>
          <Text style={styles.createButtonText}>{t.common.add}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No alerts yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <View>
              <Text style={styles.alertTitle}>{item.tokenSymbol} {item.condition} ${item.targetPrice}</Text>
              <Text style={styles.alertSub}>{item.isTriggered ? 'Triggered' : item.isActive ? 'Active' : 'Paused'}</Text>
            </View>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.smallButton} onPress={() => toggleAlert(item)}>
                <Text style={styles.smallButtonText}>{item.isActive ? 'Pause' : 'Resume'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallButton, styles.deleteButton]} onPress={() => removeAlert(item.id)}>
                <Text style={[styles.smallButtonText, styles.deleteText]}>{t.common.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1014' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
  },
  back: { color: '#E9B949', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  formCard: {
    margin: 16,
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 12,
    padding: 12,
  },
  label: {
    color: '#D8DEEE',
    marginBottom: 6,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#101422',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 9,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  conditionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  conditionButtonActive: {
    borderColor: '#E9B949',
    backgroundColor: '#271E0F',
  },
  conditionText: { color: '#A8B0C6', fontSize: 12, fontWeight: '600' },
  conditionTextActive: { color: '#F5C85C' },
  createButton: {
    marginTop: 12,
    backgroundColor: '#E9B949',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },
  createButtonText: { color: '#161616', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  alertCard: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  alertTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  alertSub: { color: '#99A2B9', fontSize: 12, marginTop: 4 },
  alertActions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  smallButton: {
    borderWidth: 1,
    borderColor: '#324064',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallButtonText: { color: '#D8DEEE', fontSize: 12, fontWeight: '600' },
  deleteButton: { borderColor: '#5D2F36' },
  deleteText: { color: '#FFA9B5' },
  empty: { textAlign: 'center', color: '#99A2B9', marginTop: 20 },
});
