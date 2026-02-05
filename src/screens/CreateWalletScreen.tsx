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
} from 'react-native';
import WalletService from '../services/WalletService';

export default function CreateWalletScreen({ navigation }: any) {
  const [mode, setMode] = useState<'select' | 'create' | 'import'>('select');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');

  const handleCreateWallet = async () => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const mnemonic = await WalletService.createWallet(password);
      setGeneratedMnemonic(mnemonic);
      Alert.alert(
        'Backup Your Wallet',
        'Please write down your recovery phrase and keep it safe!',
        [
          {
            text: 'I have saved it',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet');
    }
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
        <Text style={styles.logo}>🦅</Text>
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
    return (
      <ScrollView style={styles.formContainer}>
        <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>Create New Wallet</Text>

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

        {generatedMnemonic ? (
          <View style={styles.mnemonicContainer}>
            <Text style={styles.warningText}>⚠️ Save this recovery phrase!</Text>
            <Text style={styles.mnemonic}>{generatedMnemonic}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateWallet}>
          <Text style={styles.primaryButtonText}>Create Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    );
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
  logo: {
    fontSize: 80,
    marginBottom: 20,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
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
  mnemonicContainer: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  mnemonic: {
    fontSize: 14,
    color: '#000',
    lineHeight: 24,
  },
});
