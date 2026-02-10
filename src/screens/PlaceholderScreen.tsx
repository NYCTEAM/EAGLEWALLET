import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

export default function PlaceholderScreen({ route }: any) {
  const { t } = useLanguage();
  const name = route.name || 'Screen';
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`${name} (${t.common.loading})`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});
