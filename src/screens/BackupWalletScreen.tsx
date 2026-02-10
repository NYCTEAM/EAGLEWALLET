import React, { useState } from 'react';
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
import { useLanguage } from '../i18n/LanguageContext';

export default function BackupWalletScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);

  const revealMnemonic = async () => {
    if (!password) {
      Alert.alert(t.common.error, t.errors.passwordRequired);
      return;
    }

    setLoading(true);
    try {
      const value = await WalletService.exportMnemonic(password);
      setMnemonic(value);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.backupWallet}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.warning}>{t.settings.backupWalletMessage}</Text>

        <Text style={styles.label}>{t.wallet.password}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder={t.wallet.passwordPlaceholder}
          placeholderTextColor="#8A92A8"
        />

        <TouchableOpacity style={styles.button} onPress={revealMnemonic} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? t.common.loading : t.settings.showRecoveryPhrase}</Text>
        </TouchableOpacity>

        {mnemonic ? (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{t.wallet.mnemonic}</Text>
            <Text style={styles.boxText}>{mnemonic}</Text>
          </View>
        ) : null}
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
  warning: {
    color: '#FFBBC2',
    backgroundColor: '#2C1A1E',
    borderWidth: 1,
    borderColor: '#5D2F36',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    color: '#D8DEEE',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#161616', fontSize: 14, fontWeight: '700' },
  box: {
    marginTop: 16,
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 12,
    padding: 12,
  },
  boxTitle: { color: '#D8DEEE', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  boxText: { color: '#FFFFFF', fontSize: 12, lineHeight: 18 },
});
