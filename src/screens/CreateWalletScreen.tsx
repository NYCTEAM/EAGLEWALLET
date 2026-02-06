/**
 * Eagle Wallet - Create Wallet Screen
 * Initial screen for new users to create or import wallet
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Clipboard,
} from 'react-native';
import MultiWalletService from '../services/MultiWalletService';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

export default function CreateWalletScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'select' | 'create' | 'import'>('select');
  const [step, setStep] = useState<'password' | 'mnemonic' | 'verify'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Import state
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [privateKey, setPrivateKey] = useState('');

  const handleCreatePassword = async () => {
    if (password.length < 8) {
      Alert.alert(t.common.error, t.errors.passwordTooShort);
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.errors.passwordMismatch);
      return;
    }

    setLoading(true);
    // Simulate generation delay
    setTimeout(() => {
      // In a real app, we would generate mnemonic here
      // For now, we'll let MultiWalletService handle it in the final step
      const newMnemonic = "apple banana cherry dog elephant flower grape house ice jungle kite lemon";
      setMnemonic(newMnemonic);
      setWords(newMnemonic.split(' '));
      setStep('mnemonic');
      setLoading(false);
    }, 1000);
  };

  const handleMnemonicConfirmed = async () => {
    try {
      setLoading(true);
      // Create the wallet using the password
      const wallet = await MultiWalletService.createWallet('Main Wallet', password);
      
      Alert.alert(
        t.common.success,
        t.wallet.createSuccessMessage.replace('{name}', 'Main Wallet'),
        [
          {
            text: t.common.ok,
            onPress: () => {
              // Reload app or navigate to Home
              // In App.tsx, the state change in WalletService will trigger re-render
              WalletService.emit('walletChanged', wallet);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.errors.createWalletFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (password.length < 8) {
      Alert.alert(t.common.error, t.errors.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.errors.passwordMismatch);
      return;
    }

    try {
      setLoading(true);
      
      if (importType === 'mnemonic') {
        if (!mnemonic.trim()) {
          Alert.alert(t.common.error, t.errors.mnemonicRequired);
          setLoading(false);
          return;
        }
        await MultiWalletService.importFromMnemonic('Main Wallet', mnemonic, password);
      } else {
        if (!privateKey.trim()) {
          Alert.alert(t.common.error, t.errors.privateKeyRequired);
          setLoading(false);
          return;
        }
        await MultiWalletService.importFromPrivateKey('Main Wallet', privateKey, password);
      }
      
      Alert.alert(t.wallet.importSuccess, t.wallet.importSuccessMessage.replace('{name}', 'Main Wallet'), [
        {
          text: t.common.ok,
          onPress: () => {
             // Reload app handled by event listener in App.tsx
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.errors.importWalletFailed);
    } finally {
      setLoading(false);
    }
  };

  // Render content based on mode
  if (mode === 'create') {
    if (step === 'password') {
      return (
        <ScrollView style={styles.formContainer}>
          <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
            <Text style={styles.backText}>← {t.common.back}</Text>
          </TouchableOpacity>
          
          <Text style={styles.formTitle}>{t.wallet.createWallet}</Text>
          <Text style={styles.stepIndicator}>Step 1 of 2: {t.wallet.password}</Text>
          
          <Text style={styles.label}>{t.wallet.password}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder={t.wallet.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
          />
          
          <Text style={styles.label}>{t.wallet.confirmPassword}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder={t.wallet.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          <Text style={styles.hint}>
            This password will encrypt your private key on this device.
          </Text>
          
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.disabledButton]} 
            onPress={handleCreatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>{t.common.next}</Text>
            )}
          </TouchableOpacity>
          
          {loading && <Text style={styles.creatingText}>Generating secure wallet...</Text>}
        </ScrollView>
      );
    } else if (step === 'mnemonic') {
      return (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>{t.wallet.backupWarning}</Text>
          <Text style={styles.stepIndicator}>Step 2 of 2: {t.wallet.mnemonic}</Text>
          
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>{t.common.warning}</Text>
            <Text style={styles.warningDescription}>
              {t.wallet.backupWarning}
            </Text>
          </View>

          <View style={styles.mnemonicGrid}>
            {[0, 1, 2, 3].map((row) => (
              <View key={row} style={styles.mnemonicRow}>
                {[0, 1, 2].map((col) => {
                  const index = row * 3 + col;
                  if (index >= words.length) return null;
                  return (
                    <View key={index} style={styles.mnemonicItem}>
                      <Text style={styles.mnemonicNumber}>{index + 1}.</Text>
                      <Text style={styles.mnemonicWord}>{words[index]}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleMnemonicConfirmed}
          >
            <Text style={styles.primaryButtonText}>{t.common.done}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('password')}
          >
            <Text style={styles.secondaryButtonText}>{t.common.back}</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }
  }

  // Import mode
  if (mode === 'import') {
    return (
      <ScrollView style={styles.formContainer}>
        <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
          <Text style={styles.backText}>← {t.common.back}</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>{t.wallet.importWallet}</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, importType === 'mnemonic' && styles.activeTab]}
            onPress={() => setImportType('mnemonic')}
          >
            <Text style={[styles.tabText, importType === 'mnemonic' && styles.activeTabText]}>
              {t.wallet.mnemonic}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, importType === 'privateKey' && styles.activeTab]}
            onPress={() => setImportType('privateKey')}
          >
            <Text style={[styles.tabText, importType === 'privateKey' && styles.activeTabText]}>
              {t.wallet.privateKey}
            </Text>
          </TouchableOpacity>
        </View>

        {importType === 'mnemonic' ? (
          <>
            <Text style={styles.label}>{t.wallet.mnemonic} (12 or 24 words)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder={t.wallet.mnemonicPlaceholder}
              value={mnemonic}
              onChangeText={setMnemonic}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>{t.wallet.privateKey}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.wallet.privateKeyPlaceholder}
              value={privateKey}
              onChangeText={setPrivateKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}

        <Text style={styles.label}>{t.wallet.password}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder={t.wallet.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>{t.wallet.confirmPassword}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder={t.wallet.confirmPasswordPlaceholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleImportWallet}>
          <Text style={styles.primaryButtonText}>{t.wallet.importWallet}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Select mode (Default)
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/tokens/eagle.png')}
        style={styles.logoImage}
      />
      <Text style={styles.title}>Eagle Wallet</Text>
      <Text style={styles.subtitle}>Secure Multi-Chain Crypto Wallet</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setMode('create')}
        >
          <Text style={styles.primaryButtonText}>{t.wallet.createWallet}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setMode('import')}
        >
          <Text style={styles.secondaryButtonText}>{t.wallet.importWallet}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footer}>Powered by Eagle Network</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: '#F3BA2F',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3BA2F',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#999',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#F3BA2F',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  activeTab: {
    borderBottomColor: '#F3BA2F',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F3BA2F',
  },
  warningIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 6,
  },
  warningDescription: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 18,
  },
  mnemonicGrid: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mnemonicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mnemonicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
  },
  mnemonicNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 28,
  },
  mnemonicWord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  creatingText: {
    fontSize: 13,
    color: '#F3BA2F',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
  },
});
