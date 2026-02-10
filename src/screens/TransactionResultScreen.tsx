import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

export default function TransactionResultScreen({ navigation, route }: any) {
  const { t } = useLanguage();

  const status: 'success' | 'failed' = route.params?.status || 'success';
  const txHash: string | undefined = route.params?.txHash;
  const message: string = route.params?.message || (status === 'success' ? t.transaction.success : t.transaction.failure);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.status, status === 'success' ? styles.success : styles.failed]}>
          {status === 'success' ? t.transaction.success : t.transaction.failure}
        </Text>

        <Text style={styles.message}>{message}</Text>

        {txHash ? <Text style={styles.hash}>{txHash}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.primaryButtonText}>{t.send.backToHome}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('TransactionHistory')}>
          <Text style={styles.secondaryButtonText}>{t.transaction.history}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 14,
    padding: 16,
  },
  status: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  success: {
    color: '#3ED598',
  },
  failed: {
    color: '#FF8A9A',
  },
  message: {
    color: '#D8DEEE',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  hash: {
    color: '#9BA3BA',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#151515',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#344063',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#D8DEEE',
    fontWeight: '600',
    fontSize: 14,
  },
});
