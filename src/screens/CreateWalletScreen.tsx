/**
 * Eagle Wallet - Create/Import Wallet Screen
 * Initial setup screen for new users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import WalletService from '../services/WalletService';

export default function CreateWalletScreen({ navigation }: any) {
  const [mode, setMode] = useState<'select' | 'create' | 'import'>('select');
  const [step, setStep] = useState<'password' | 'mnemonic' | 'confirm'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handlePasswordSubmit = async () => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsCreating(true);
    try {
      const mnemonic = await WalletService.createWallet(password);
      setGeneratedMnemonic(mnemonic);
      setStep('mnemonic');
    } catch (error: any) {
      console.error('Create wallet error:', error);
      Alert.alert('Error', `Failed to create wallet: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleMnemonicConfirmed = () => {
    Alert.alert(
      'Important!',
      'Have you written down all 12 words? You will need them to recover your wallet.',
      [
        { text: 'NOT YET', style: 'cancel' },
        {
          text: 'YES, I SAVED IT',
          onPress: () => {
            // Wallet is already created and saved
            // App.tsx will automatically detect wallet exists and switch to Home screen
            // Just close the alert - the interval in App.tsx will handle navigation
          },
        },
      ]
    );
  };

  const handleImportWallet = async () => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      if (importType === 'mnemonic') {
        if (!mnemonic.trim()) {
          Alert.alert('Error', 'Please enter your recovery phrase');
          return;
        }
        await WalletService.importFromMnemonic(mnemonic.trim(), password);
      } else {
        if (!privateKey.trim()) {
          Alert.alert('Error', 'Please enter your private key');
          return;
        }
        await WalletService.importFromPrivateKey(privateKey.trim(), password);
      }
      Alert.alert('Success', 'Wallet imported successfully!', [
        { text: 'OK', onPress: () => navigation.replace('Home') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet. Please check your input.');
    }
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <Image 
          source={require('../../android/app/src/main/res/drawable/eagle_logo.png')}
          style={styles.logoImage}
        />
        <Text style={styles.title}>Eagle Wallet</Text>
        <Text style={styles.subtitle}>Secure BSC & XLAYER Wallet</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setMode('create')}
          >
            <Text style={styles.primaryButtonText}>Create New Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMode('import')}
          >
            <Text style={styles.secondaryButtonText}>Import Wallet</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Only BSC and XLAYER networks supported
        </Text>
      </View>
    );
  }

  if (mode === 'create') {
    // Step 1: Enter Password
    if (step === 'password') {
      return (
        <ScrollView style={styles.formContainer}>
          <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Create New Wallet</Text>
          <Text style={styles.stepIndicator}>Step 1 of 2: Set Password</Text>

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter password (min 8 characters)"
            value={password}
            onChangeText={setPassword}
            editable={!isCreating}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isCreating}
          />

          {isCreating && (
            <Text style={styles.creatingText}>Creating wallet... This may take a few seconds</Text>
          )}

          <TouchableOpacity 
            style={[styles.primaryButton, isCreating && styles.disabledButton]} 
            onPress={handlePasswordSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // Step 2: Show Mnemonic
    if (step === 'mnemonic') {
      const words = generatedMnemonic.split(' ');
      return (
        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>Backup Recovery Phrase</Text>
          <Text style={styles.stepIndicator}>Step 2 of 2: Save Your Recovery Phrase</Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>Write down these 12 words</Text>
            <Text style={styles.warningDescription}>
              Keep them in a safe place. This is the ONLY way to recover your wallet if you lose access.
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
            <Text style={styles.primaryButtonText}>I Have Saved It</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setStep('password')}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }
  }

  // Import mode
  return (
    <ScrollView style={styles.formContainer}>
      <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>Import Wallet</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, importType === 'mnemonic' && styles.activeTab]}
          onPress={() => setImportType('mnemonic')}
        >
          <Text style={[styles.tabText, importType === 'mnemonic' && styles.activeTabText]}>
            Recovery Phrase
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, importType === 'privateKey' && styles.activeTab]}
          onPress={() => setImportType('privateKey')}
        >
          <Text style={[styles.tabText, importType === 'privateKey' && styles.activeTabText]}>
            Private Key
          </Text>
        </TouchableOpacity>
      </View>

      {importType === 'mnemonic' ? (
        <>
          <Text style={styles.label}>Recovery Phrase (12 or 24 words)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Enter your recovery phrase"
            value={mnemonic}
            onChangeText={setMnemonic}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Private Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your private key (0x...)"
            value={privateKey}
            onChangeText={setPrivateKey}
            secureTextEntry
          />
        </>
      )}

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Enter password (min 8 characters)"
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleImportWallet}>
        <Text style={styles.primaryButtonText}>Import Wallet</Text>
      </TouchableOpacity>
    </ScrollView>
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
});
