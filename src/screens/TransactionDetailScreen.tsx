import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

export default function TransactionDetailScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const tx = route.params?.tx;

  const copyHash = () => {
    if (!tx?.hash) {
      return;
    }

    Clipboard.setString(tx.hash);
    Alert.alert(t.common.success, t.transaction.hashCopied);
  };

  const openExplorer = async () => {
    if (!tx?.hash) {
      return;
    }

    const network = WalletService.getCurrentNetwork();
    const url = `${network.blockExplorerUrl}/tx/${tx.hash}`;
    await Linking.openURL(url);
  };

  const renderRow = (label: string, value: string | number | undefined) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value === undefined || value === null ? '-' : String(value)}</Text>
    </View>
  );

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{t.common.back}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.transaction.transactionDetails}</Text>
          <View style={{ width: 48 }} />
        </View>
        <Text style={styles.empty}>{t.errors.notFound}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.transaction.transactionDetails}</Text>
        <TouchableOpacity onPress={copyHash}>
          <Text style={styles.action}>{t.common.copy}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {renderRow(t.transaction.hash, tx.hash)}
          {renderRow(t.transaction.status, tx.status)}
          {renderRow(t.transaction.from, tx.from)}
          {renderRow(t.transaction.to, tx.to)}
          {renderRow(t.transaction.amount, tx.value)}
          {renderRow(t.transaction.time, new Date(tx.timestamp).toLocaleString())}
          {renderRow(t.transaction.nonce, tx.nonce)}
          {renderRow(t.transaction.block, tx.blockNumber)}
          {renderRow(t.transaction.confirming, tx.confirmations)}
          {renderRow(t.transaction.gasUsed, tx.gasUsed)}
          {renderRow(t.transaction.gasPrice, tx.gasPrice)}
        </View>

        <TouchableOpacity style={styles.button} onPress={openExplorer}>
          <Text style={styles.buttonText}>{t.transaction.viewOnExplorer}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  action: { color: '#E9B949', fontSize: 13, fontWeight: '700' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 12,
    padding: 12,
  },
  row: {
    marginBottom: 10,
  },
  rowLabel: {
    color: '#95A0BC',
    fontSize: 12,
    marginBottom: 3,
  },
  rowValue: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#141414',
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    color: '#95A0BC',
    textAlign: 'center',
    marginTop: 30,
  },
});
