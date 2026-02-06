/**
 * Eagle Wallet - Add Custom DApp Screen
 * Allow users to add their own DApp URLs
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import DAppService from '../services/DAppService';
import WalletService from '../services/WalletService';

export default function AddDAppScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🌐');

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert(t.common.error, t.dapp.dappName);
      return;
    }

    if (!url.trim() || !DAppService.isValidUrl(url)) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    const network = WalletService.getCurrentNetwork();

    const newDApp = DAppService.addCustomDApp({
      name: name.trim(),
      url: url.trim(),
      description: description.trim() || 'Custom DApp',
      icon: icon || '🌐',
      category: 'other',
      chainId: network.chainId,
    });

    Alert.alert(t.common.success, t.dapp.dappAdded, [
      {
        text: t.common.ok,
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const iconOptions = ['🌐', '💰', '🎮', '🖼️', '📊', '⚡', '🚀', '🏦', '🔄', '🔥'];
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.cancel}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.dapp.addDApp}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Icon Selector */}
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {iconOptions.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.iconOption,
                icon === emoji && styles.iconOptionSelected,
              ]}
              onPress={() => setIcon(emoji)}
            >
              <Text style={styles.iconEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name Input */}
        <Text style={styles.label}>{t.dapp.dappName} *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., My DApp"
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* URL Input */}
        <Text style={styles.label}>{t.dapp.dappUrl} *</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        {/* Description Input */}
        <Text style={styles.label}>{t.nft.description} ({t.common.edit})</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief description of the DApp"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={100}
        />

        {/* Network Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ This DApp will be added to{' '}
            {WalletService.getCurrentNetwork().name}
          </Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>{t.dapp.addDApp}</Text>
        </TouchableOpacity>

        {/* Examples */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>{t.dapp.popularDApps}:</Text>
          <TouchableOpacity
            style={styles.exampleItem}
            onPress={() => {
              setName('PancakeSwap');
              setUrl('https://pancakeswap.finance');
              setDescription('Leading DEX on BSC');
              setIcon('🥞');
            }}
          >
            <Text style={styles.exampleText}>🥞 PancakeSwap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exampleItem}
            onPress={() => {
              setName('Uniswap');
              setUrl('https://app.uniswap.org');
              setDescription('Decentralized exchange');
              setIcon('🦄');
            }}
          >
            <Text style={styles.exampleText}>🦄 Uniswap</Text>
          </TouchableOpacity>
        </View>
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
    height: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  iconOptionSelected: {
    borderColor: '#F3BA2F',
    backgroundColor: '#FFF9E6',
  },
  iconEmoji: {
    fontSize: 28,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
  },
  addButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  examplesSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  exampleItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#000',
  },
});
