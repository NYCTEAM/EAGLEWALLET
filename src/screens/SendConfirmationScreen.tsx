import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WalletService from '../services/WalletService';
import TransactionService from '../services/TransactionService';
import { useLanguage } from '../i18n/LanguageContext';

export default function SendConfirmationScreen({ navigation, route }: any) {
  const { t } = useLanguage();

  const token = route.params?.token;
  const recipientAddress = route.params?.recipientAddress;
  const amount = route.params?.amount;

  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!recipientAddress || !amount) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    setSending(true);
    try {
      let txHash = '';

      if (!token || token.address === 'native') {
        txHash = await WalletService.sendTransaction(recipientAddress, String(amount));
      } else {
        txHash = await WalletService.sendToken(
          token.address,
          recipientAddress,
          String(amount),
          token.decimals || 18
        );
      }

      await TransactionService.addPendingTransaction({
        hash: txHash,
        from: (await WalletService.getAddress()) || '',
        to: recipientAddress,
        value: String(amount),
        token: token ? { address: token.address, symbol: token.symbol, decimals: token.decimals || 18 } : undefined,
        timestamp: Date.now(),
        status: 'pending',
        nonce: 0,
        chainId: WalletService.getCurrentNetwork().chainId,
      });

      navigation.replace('TransactionResult', {
        status: 'success',
        txHash,
        message: t.transaction.confirming,
      });
    } catch (error: any) {
      navigation.replace('TransactionResult', {
        status: 'failed',
        message: error?.message || t.errors.transactionFailed,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.send.confirmTransaction}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.row}>{t.send.to}: {recipientAddress}</Text>
        <Text style={styles.row}>{t.send.amount}: {amount} {token?.symbol || WalletService.getCurrentNetwork().symbol}</Text>
        <Text style={styles.row}>{t.send.gasFee}: ~0.0005 {WalletService.getCurrentNetwork().symbol}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={submit} disabled={sending}>
        {sending ? <ActivityIndicator color="#171717" /> : <Text style={styles.buttonText}>{t.common.confirm}</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1014', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
    marginBottom: 16,
  },
  back: { color: '#E9B949', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 12,
    padding: 12,
  },
  row: {
    color: '#D8DEEE',
    fontSize: 13,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: { color: '#171717', fontSize: 14, fontWeight: '700' },
});
