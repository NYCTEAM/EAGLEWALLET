/**
 * Eagle Wallet - Export Private Key Screen
 * View and backup private key
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Clipboard,
} from 'react-native';
import WalletService from '../services/WalletService';

export default function ExportPrivateKeyScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRevealPrivateKey = async () => {
    if (!password) {
      Alert.alert(t.common.error, t.errors.passwordRequired);
      return;
    }

    try {
      setLoading(true);
      // Verify password and get private key
      const key = await WalletService.exportPrivateKey(password);
      setPrivateKey(key);
      setRevealed(true);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.errors.invalidInput);
    } finally {
      setLoading(false);
    }
  };

  const copyPrivateKey = () => {
    Clipboard.setString(privateKey);
    Alert.alert(t.common.copied, t.common.contentCopied || t.common.copied);
  };

  const handleClose = () => {
    Alert.alert(
      t.common.close,
      t.settings.exportPrivateKeyMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.close,
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.exportPrivateKey}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>{t.common.warning}</Text>
          <Text style={styles.warningText}>
            • {t.settings.exportPrivateKeyMessage}
          </Text>
          <Text style={styles.warningText}>
            • {t.wallet.backupWarning}
          </Text>
        </View>

        {!revealed ? (
          <>
            {/* Password Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>{t.wallet.password}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.wallet.passwordPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoFocus
              />
            </View>

            {/* Reveal Button */}
            <TouchableOpacity
              style={styles.revealButton}
              onPress={handleRevealPrivateKey}
              disabled={loading}
            >
              <Text style={styles.revealButtonText}>
                {loading ? t.common.loading : t.settings.show}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Private Key Display */}
            <View style={styles.keyContainer}>
              <Text style={styles.keyLabel}>{t.wallet.privateKey}</Text>
              <View style={styles.keyBox}>
                <Text style={styles.keyText} selectable>
                  {privateKey}
                </Text>
              </View>

              {/* Copy Button */}
              <TouchableOpacity style={styles.copyButton} onPress={copyPrivateKey}>
                <Text style={styles.copyButtonText}>📋 {t.common.copy}</Text>
              </TouchableOpacity>
            </View>

            {/* Security Reminder */}
            <View style={styles.reminderBox}>
              <Text style={styles.reminderTitle}>🛡️ {t.settings.security}</Text>
              <Text style={styles.reminderText}>
                • {t.settings.backupWalletMessage}
              </Text>
            </View>

            {/* Done Button */}
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>{t.common.done}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#F3BA2F',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  warningIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 6,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  revealButton: {
    backgroundColor: '#F3BA2F',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  revealButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  keyContainer: {
    marginBottom: 24,
  },
  keyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  keyBox: {
    backgroundColor: '#000000',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  keyText: {
    fontSize: 14,
    color: '#00FF00',
    fontFamily: 'monospace',
    lineHeight: 24,
  },
  copyButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3BA2F',
  },
  copyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  reminderBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 6,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#43A047',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
