import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MultiWalletService from '../services/MultiWalletService';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

type Mode = 'create' | 'mnemonic' | 'privateKey' | 'watch';

export default function AddWalletScreen({ navigation }: any) {
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [watchAddress, setWatchAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activateWallet = async (walletId: string, isWatch: boolean, address?: string) => {
    await MultiWalletService.switchWallet(walletId);

    if (isWatch && address) {
      await WalletService.setReadOnlyAddress(address);
      return;
    }

    const walletInstance = await MultiWalletService.getWalletInstance(walletId);
    if (!walletInstance) {
      throw new Error('Unable to load wallet private key');
    }

    await WalletService.setActiveWalletFromPrivateKey(walletInstance.privateKey);
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'create') {
        if (!password || password.length < 8) {
          throw new Error(t.errors.passwordTooShort);
        }

        const wallet = await MultiWalletService.createWallet(name.trim(), password);
        await activateWallet(wallet.id, false);
      }

      if (mode === 'mnemonic') {
        if (!secretInput.trim()) {
          throw new Error(t.errors.mnemonicRequired);
        }
        if (!password || password.length < 8) {
          throw new Error(t.errors.passwordTooShort);
        }

        const wallet = await MultiWalletService.importFromMnemonic(name.trim(), secretInput.trim(), password);
        await activateWallet(wallet.id, false);
      }

      if (mode === 'privateKey') {
        if (!secretInput.trim()) {
          throw new Error(t.errors.privateKeyRequired);
        }
        if (!password || password.length < 8) {
          throw new Error(t.errors.passwordTooShort);
        }

        const wallet = await MultiWalletService.importFromPrivateKey(name.trim(), secretInput.trim(), password);
        await activateWallet(wallet.id, false);
      }

      if (mode === 'watch') {
        if (!watchAddress.trim()) {
          throw new Error(t.errors.invalidAddress);
        }

        const wallet = await MultiWalletService.addWatchWallet(name.trim(), watchAddress.trim());
        await activateWallet(wallet.id, true, wallet.address);
      }

      Alert.alert(t.common.success, t.wallet.importSuccess);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    } finally {
      setSubmitting(false);
    }
  };

  const renderModeButton = (value: Mode, label: string) => (
    <TouchableOpacity
      key={value}
      style={[styles.modeButton, mode === value && styles.modeButtonActive]}
      onPress={() => setMode(value)}
    >
      <Text style={[styles.modeButtonText, mode === value && styles.modeButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.common.add} {t.wallet.myWallets}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.modeRow}>
          {renderModeButton('create', 'Create')}
          {renderModeButton('mnemonic', 'Mnemonic')}
          {renderModeButton('privateKey', 'Private Key')}
          {renderModeButton('watch', 'Watch')}
        </View>

        <Text style={styles.label}>{t.wallet.walletName}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t.wallet.walletNamePlaceholder}
          placeholderTextColor="#8D95AC"
        />

        {mode === 'mnemonic' ? (
          <>
            <Text style={styles.label}>{t.wallet.mnemonic}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={secretInput}
              onChangeText={setSecretInput}
              placeholder={t.wallet.mnemonicPlaceholder}
              placeholderTextColor="#8D95AC"
              multiline
              textAlignVertical="top"
            />
          </>
        ) : null}

        {mode === 'privateKey' ? (
          <>
            <Text style={styles.label}>{t.wallet.privateKey}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={secretInput}
              onChangeText={setSecretInput}
              placeholder={t.wallet.privateKeyPlaceholder}
              placeholderTextColor="#8D95AC"
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
            />
          </>
        ) : null}

        {mode === 'watch' ? (
          <>
            <Text style={styles.label}>{t.send.recipientAddress}</Text>
            <TextInput
              style={styles.input}
              value={watchAddress}
              onChangeText={setWatchAddress}
              placeholder="0x..."
              placeholderTextColor="#8D95AC"
              autoCapitalize="none"
            />
            <Text style={styles.hint}>Watch wallet can view balances, but cannot send transactions.</Text>
          </>
        ) : null}

        {mode !== 'watch' ? (
          <>
            <Text style={styles.label}>{t.wallet.password}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t.wallet.passwordPlaceholder}
              placeholderTextColor="#8D95AC"
              secureTextEntry
            />
            <Text style={styles.hint}>{t.wallet.passwordHint}</Text>
          </>
        ) : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? t.common.loading : t.common.confirm}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: '#2C3550',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: '#E9B949',
    backgroundColor: '#261E0F',
  },
  modeButtonText: {
    color: '#A8B0C6',
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#F5C85C',
  },
  label: {
    color: '#D7DDED',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 10,
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
  textArea: {
    minHeight: 92,
  },
  hint: {
    color: '#8D95AC',
    marginTop: 6,
    fontSize: 12,
  },
  submitButton: {
    marginTop: 22,
    backgroundColor: '#E9B949',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
});
