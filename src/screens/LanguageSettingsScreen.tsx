/**
 * Eagle Wallet - Language Settings Screen
 * Allow users to change app language
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSettingsScreen({ navigation }: any) {
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  const handleSelectLanguage = async (langCode: string) => {
    await setLanguage(langCode as any);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.language}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Language List */}
      <ScrollView style={styles.content}>
        {availableLanguages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageItem,
              language === lang.code && styles.languageItemActive,
            ]}
            onPress={() => handleSelectLanguage(lang.code)}
          >
            <View>
              <Text style={styles.languageName}>{lang.nativeName}</Text>
              <Text style={styles.languageNameEn}>{lang.name}</Text>
            </View>
            {language === lang.code && (
              <Text style={styles.checkMark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
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
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemActive: {
    borderColor: '#F3BA2F',
    backgroundColor: '#FFF9E6',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  languageNameEn: {
    fontSize: 13,
    color: '#666',
  },
  checkMark: {
    fontSize: 24,
    color: '#F3BA2F',
    fontWeight: 'bold',
  },
});
