import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LanguageSettingsScreen({ navigation }: any) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();

  const handleLanguageSelect = async (langCode: any) => {
    await setLanguage(langCode);
    // Optional: Navigate back or show confirmation
    // navigation.goBack();
  };

  const renderItem = ({ item }: { item: typeof availableLanguages[0] }) => {
    const isSelected = language === item.code;
    return (
      <TouchableOpacity 
        style={[styles.languageItem, isSelected && styles.selectedItem]} 
        onPress={() => handleLanguageSelect(item.code)}
      >
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isSelected && styles.selectedText]}>
            {item.nativeName}
          </Text>
          <Text style={[styles.languageCode, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
        </View>
        {isSelected && (
          <Icon name="check" size={24} color="#F3BA2F" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.language}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={availableLanguages}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    borderColor: '#F3BA2F',
    backgroundColor: '#FFFBF0',
  },
  languageInfo: {
    flexDirection: 'column',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  languageCode: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#B38600',
  },
});

