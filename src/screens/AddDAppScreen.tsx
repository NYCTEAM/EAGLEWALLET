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
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletService from '../services/WalletService';
import DAppService from '../services/DAppService';
import { useLanguage } from '../i18n/LanguageContext';

const CUSTOM_DAPPS_KEY = 'EAGLE_CUSTOM_DAPPS';

export default function AddDAppScreen({ navigation }: any) {
  const { t } = useLanguage();
  const network = WalletService.getCurrentNetwork();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'defi' | 'nft' | 'game' | 'social' | 'other'>('defi');
  const [saving, setSaving] = useState(false);

  const saveDapp = async () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    const normalizedUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
    if (!DAppService.isValidUrl(normalizedUrl)) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    setSaving(true);
    try {
      const existingRaw = await AsyncStorage.getItem(CUSTOM_DAPPS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];

      const record = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        url: normalizedUrl,
        icon: name.trim()[0].toUpperCase(),
        description: description.trim() || t.dapp.customDApp,
        category,
        chainId: network.chainId,
      };

      const deduped = [
        ...existing.filter((item: any) => item.url.toLowerCase() !== normalizedUrl.toLowerCase()),
        record,
      ];

      await AsyncStorage.setItem(CUSTOM_DAPPS_KEY, JSON.stringify(deduped));
      Alert.alert(t.common.success, t.dapp.dappAdded, [
        { text: t.common.done, onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryButton = (value: typeof category, label: string) => (
    <TouchableOpacity
      key={value}
      style={[styles.categoryButton, category === value && styles.categoryButtonActive]}
      onPress={() => setCategory(value)}
    >
      <Text style={[styles.categoryText, category === value && styles.categoryTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.dapp.addDApp}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t.dapp.dappName}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Eagle Swap"
          placeholderTextColor="#8E96AD"
        />

        <Text style={styles.label}>{t.dapp.dappUrl}</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://..."
          autoCapitalize="none"
          placeholderTextColor="#8E96AD"
        />

        <Text style={styles.label}>{t.dapp.description}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t.dapp.addInfo}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#8E96AD"
        />

        <Text style={styles.label}>{t.dapp.category}</Text>
        <View style={styles.categoryRow}>
          {renderCategoryButton('defi', t.dapp.categoryDefi)}
          {renderCategoryButton('nft', t.dapp.categoryNft)}
          {renderCategoryButton('game', t.dapp.categoryGame)}
          {renderCategoryButton('social', t.dapp.categorySocial)}
          {renderCategoryButton('other', t.dapp.categoryOther)}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={saveDapp} disabled={saving}>
          <Text style={styles.submitText}>{saving ? t.common.loading : t.common.save}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1017',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2535',
  },
  back: {
    color: '#E9B949',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  label: {
    color: '#D9DFEF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 88,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  categoryButtonActive: {
    borderColor: '#E9B949',
    backgroundColor: '#2A220F',
  },
  categoryText: {
    color: '#A8B0C6',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#F5C85C',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitText: {
    color: '#171717',
    fontWeight: '700',
    fontSize: 14,
  },
});
