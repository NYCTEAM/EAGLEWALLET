/**
 * Eagle Wallet - Transaction Result Screen
 * Show transaction success or failure
 */

import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function TransactionResultScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const { success, txHash, error, token, amount } = route.params || {};

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleViewTransaction = () => {
    // Open block explorer
    console.log('View transaction:', txHash);
  };

  return (
    <View style={styles.container}>
      {/* Result Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{success ? '✓' : '✕'}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        {success ? t.swap.swapSuccess : t.swap.swapFailed}
      </Text>

      {/* Message */}
      <Text style={styles.message}>
        {success
          ? `${t.transaction.sent} ${amount} ${token?.symbol}`
          : error || t.errors.transactionFailed}
      </Text>

      {/* Transaction Hash */}
      {success && txHash && (
        <View style={styles.hashCard}>
          <Text style={styles.hashLabel}>{t.transaction.hash}</Text>
          <Text style={styles.hashValue}>{txHash.slice(0, 20)}...</Text>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttons}>
        {success && txHash && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewTransaction}>
            <Text style={styles.secondaryButtonText}>{t.transaction.viewOnExplorer}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
          <Text style={styles.primaryButtonText}>{t.common.done}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  hashCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 32,
  },
  hashLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  hashValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#000',
  },
  buttons: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#F3BA2F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
