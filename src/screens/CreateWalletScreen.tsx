import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { ethers } from 'ethers';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

type ScreenStep = 'landing' | 'create_password' | 'show_mnemonic' | 'import_select' | 'import_input';
type ImportType = 'mnemonic' | 'privateKey';

const { width } = Dimensions.get('window');

export default function CreateWalletScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [step, setStep] = useState<ScreenStep>('landing');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [importType, setImportType] = useState<ImportType>('mnemonic');
  const [importValue, setImportValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Actions ---

  const handleCreateStart = () => {
    setStep('create_password');
    setPassword('');
    setConfirmPassword('');
  };

  const handleGenerateWallet = async () => {
    if (password.length < 8) {
      Alert.alert(t.common.error, t.errors.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.errors.passwordMismatch);
      return;
    }

    setIsLoading(true);
    // Give UI time to update
    setTimeout(async () => {
      try {
        // Generate wallet locally first to show mnemonic BEFORE saving
        const randomWallet = ethers.Wallet.createRandom();
        if (randomWallet.mnemonic) {
          setMnemonic(randomWallet.mnemonic.phrase);
          setStep('show_mnemonic');
        } else {
          throw new Error('Failed to generate mnemonic');
        }
      } catch (error) {
        console.error(error);
        Alert.alert(t.common.error, t.errors.createWalletFailed);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleConfirmBackup = async () => {
    setIsLoading(true);
    setTimeout(async () => {
      try {
        // Now save the wallet using the generated mnemonic
        await WalletService.importFromMnemonic(mnemonic, password);
        // App.tsx will automatically switch to MainScreen when it detects wallet
      } catch (error) {
        console.error(error);
        Alert.alert(t.common.error, t.errors.createWalletFailed);
        setIsLoading(false);
      }
    }, 100);
  };

  const handleImportStart = () => {
    setStep('import_input');
    setImportType('mnemonic');
    setImportValue('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleImportWallet = async () => {
    if (!importValue.trim()) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }
    
    if (password.length < 8) {
      Alert.alert(t.common.error, t.errors.passwordTooShort);
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      try {
        if (importType === 'mnemonic') {
            await WalletService.importFromMnemonic(importValue.trim(), password);
        } else {
            await WalletService.importFromPrivateKey(importValue.trim(), password);
        }
        // App.tsx will switch screen
      } catch (error) {
        console.error(error);
        Alert.alert(t.common.error, t.errors.importWalletFailed);
        setIsLoading(false);
      }
    }, 100);
  };

  const copyMnemonic = () => {
    Clipboard.setString(mnemonic);
    Alert.alert(t.common.copied, t.common.contentCopied);
  };

  // --- Render Steps ---

  const renderLanding = () => (
    <View style={styles.centerContent}>
      <View style={styles.logoContainer}>
        <Icon name="wallet" size={80} color="#F3BA2F" />
        <Text style={styles.appTitle}>Eagle Wallet</Text>
        <Text style={styles.appSubtitle}>{t.wallet.appSubtitle}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateStart}>
          <Text style={styles.primaryButtonText}>{t.wallet.createWallet}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleImportStart}>
          <Text style={styles.secondaryButtonText}>{t.wallet.importWallet}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreatePassword = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.wallet.createWallet}</Text>
      <Text style={styles.stepDescription}>{t.wallet.passwordHint}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.wallet.password}</Text>
        <View style={styles.passwordContainer}>
            <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t.wallet.passwordPlaceholder}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#999" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.wallet.confirmPassword}</Text>
        <View style={styles.passwordContainer}>
            <TextInput
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t.wallet.confirmPasswordPlaceholder}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
            />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleGenerateWallet}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{t.common.next}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.textButton} onPress={() => setStep('landing')}>
        <Text style={styles.textButtonText}>{t.common.cancel}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderShowMnemonic = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.wallet.mnemonic}</Text>
      <View style={styles.warningContainer}>
        <Icon name="alert-circle-outline" size={24} color="#D32F2F" />
        <Text style={styles.warningText}>{t.wallet.backupWarning}</Text>
      </View>

      <TouchableOpacity style={styles.mnemonicBox} onPress={copyMnemonic}>
        <Text style={styles.mnemonicText}>{mnemonic}</Text>
        <View style={styles.copyHint}>
            <Icon name="content-copy" size={16} color="#F3BA2F" />
            <Text style={styles.copyHintText}>{t.common.copy}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleConfirmBackup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{t.common.done}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderImportInput = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.wallet.importWallet}</Text>
      
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

      <TextInput
        style={styles.textArea}
        value={importValue}
        onChangeText={setImportValue}
        placeholder={importType === 'mnemonic' ? t.wallet.mnemonicPlaceholder : t.wallet.privateKeyPlaceholder}
        multiline
        placeholderTextColor="#999"
        textAlignVertical="top"
      />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t.wallet.password}</Text>
        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder={t.wallet.passwordPlaceholder}
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
            />
             <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#999" />
            </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleImportWallet}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{t.common.done}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.textButton} onPress={() => setStep('landing')}>
        <Text style={styles.textButtonText}>{t.common.cancel}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 'landing' && renderLanding()}
          {step === 'create_password' && renderCreatePassword()}
          {step === 'show_mnemonic' && renderShowMnemonic()}
          {step === 'import_input' && renderImportInput()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#F3BA2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  textButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#666',
    fontSize: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  warningText: {
    color: '#D32F2F',
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  mnemonicBox: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mnemonicText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '500',
  },
  copyHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  copyHintText: {
    color: '#F3BA2F',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    height: 120,
    backgroundColor: '#FAFAFA',
    marginBottom: 24,
    fontSize: 16,
    color: '#333',
  },
});
