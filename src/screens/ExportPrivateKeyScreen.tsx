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
import Clipboard from '@react-native-clipboard/clipboard';
import WalletService from '../services/WalletService';
import MultiWalletService from '../services/MultiWalletService';
import { useLanguage } from '../i18n/LanguageContext';

type ExportMode = 'privateKey' | 'mnemonic';

export default function ExportPrivateKeyScreen({ navigation, route }: any) {
  const { t } = useLanguage();

  const walletId: string | undefined = route.params?.walletId;
  const walletName: string | undefined = route.params?.walletName;

  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<ExportMode>('privateKey');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const exportSecret = async () => {
    if (!password) {
      Alert.alert(t.common.error, t.errors.passwordRequired);
      return;
    }

    setLoading(true);
    try {
      let value = '';

      if (mode === 'privateKey') {
        value = walletId
          ? await MultiWalletService.exportPrivateKey(walletId, password)
          : await WalletService.exportPrivateKey(password);
      } else {
        if (walletId) {
          throw new Error(t.errors.permissionDenied);
        }
        value = await WalletService.exportMnemonic(password);
      }

      setSecret(value);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (!secret) {
      return;
    }

    Clipboard.setString(secret);
    Alert.alert(t.common.success, t.common.contentCopied);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.exportPrivateKey}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.warning}>{t.settings.exportPrivateKeyMessage}</Text>
        {walletName ? <Text style={styles.walletName}>{t.wallet.walletName}: {walletName}</Text> : null}

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'privateKey' && styles.modeButtonActive]}
            onPress={() => setMode('privateKey')}
          >
            <Text style={[styles.modeText, mode === 'privateKey' && styles.modeTextActive]}>{t.wallet.privateKeyName}</Text>
          </TouchableOpacity>

          {!walletId ? (
            <TouchableOpacity
              style={[styles.modeButton, mode === 'mnemonic' && styles.modeButtonActive]}
              onPress={() => setMode('mnemonic')}
            >
              <Text style={[styles.modeText, mode === 'mnemonic' && styles.modeTextActive]}>{t.wallet.mnemonic}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>{t.wallet.password}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t.wallet.passwordPlaceholder}
          placeholderTextColor="#8A92A8"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={exportSecret} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? t.common.loading : t.settings.show}</Text>
        </TouchableOpacity>

        {secret ? (
          <View style={styles.secretBox}>
            <Text style={styles.secretLabel}>{mode === 'privateKey' ? t.wallet.privateKeyName : t.wallet.mnemonic}</Text>
            <Text style={styles.secretValue}>{secret}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copySecret}>
              <Text style={styles.copyText}>{t.common.copy}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
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
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  warning: {
    color: '#FFB4BE',
    backgroundColor: '#2C1A1E',
    borderWidth: 1,
    borderColor: '#5D2F36',
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  walletName: {
    color: '#A8B0C6',
    marginTop: 10,
    fontSize: 12,
  },
  modeRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: '#E9B949',
    backgroundColor: '#261F10',
  },
  modeText: {
    color: '#A8B0C6',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#F5C85C',
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
    fontSize: 14,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#161616',
    fontWeight: '700',
    fontSize: 14,
  },
  secretBox: {
    marginTop: 16,
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 12,
    padding: 12,
  },
  secretLabel: {
    color: '#D8DEEE',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  secretValue: {
    color: '#F7F9FF',
    fontSize: 12,
    lineHeight: 18,
  },
  copyButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#3A4363',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  copyText: {
    color: '#D8DEEE',
    fontSize: 12,
    fontWeight: '600',
  },
});
