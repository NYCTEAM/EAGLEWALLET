import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import WalletService from '../services/WalletService';
import TokenService from '../services/TokenService';
import { useLanguage } from '../i18n/LanguageContext';

export default function EnterAmountScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const token = route.params?.token;
  const recipientAddress = route.params?.recipientAddress;

  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    (async () => {
      const address = await WalletService.getAddress();
      if (!address) {
        return;
      }

      if (!token || token.address === 'native') {
        const nativeBalance = await WalletService.getBalance();
        setBalance(nativeBalance);
        return;
      }

      const provider = await WalletService.getProvider();
      const tokenBalance = await TokenService.getTokenBalance(token.address, address, provider);
      setBalance(tokenBalance);
    })();
  }, [token]);

  const setMax = () => {
    const max = Number(balance);
    const safeMax = !token || token.address === 'native' ? Math.max(0, max - 0.0005) : max;
    setAmount(String(safeMax));
  };

  const goNext = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert(t.common.error, t.errors.invalidAmount);
      return;
    }

    if (value > Number(balance)) {
      Alert.alert(t.common.error, t.errors.insufficientBalance);
      return;
    }

    navigation.navigate('SendConfirmation', {
      token,
      recipientAddress,
      amount,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.send.enterAmount}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t.send.balance}: {Number(balance).toFixed(6)} {token?.symbol || WalletService.getCurrentNetwork().symbol}</Text>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.0"
          keyboardType="decimal-pad"
          placeholderTextColor="#8D95AC"
        />

        <TouchableOpacity style={styles.maxButton} onPress={setMax}>
          <Text style={styles.maxText}>{t.send.max}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextText}>{t.common.next}</Text>
        </TouchableOpacity>
      </View>
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
  content: { padding: 16 },
  label: { color: '#D8DEEE', marginBottom: 8, fontSize: 13 },
  input: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 18,
  },
  maxButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  maxText: { color: '#E9B949', fontWeight: '700', fontSize: 12 },
  nextButton: {
    marginTop: 16,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextText: { color: '#151515', fontWeight: '700', fontSize: 14 },
});
