import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

const AI_WEB_URL = 'https://ai.eagleswaps.com/';

export default function AIScreen({ navigation }: any) {
  const { t } = useLanguage();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.navigate('DAppWebView', {
      url: AI_WEB_URL,
      title: t.ai.title,
      autoConnect: true,
    });
  }, [navigation, t.ai.title]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="small" color="#F3BA2F" />
        <Text style={styles.text}>{t.ai.title}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('DAppWebView', {
              url: AI_WEB_URL,
              title: t.ai.title,
              autoConnect: true,
            })
          }
        >
          <Text style={styles.buttonText}>{t.dapp.openInBrowser}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3BA2F',
  },
  buttonText: {
    color: '#111',
    fontWeight: '600',
  },
});
