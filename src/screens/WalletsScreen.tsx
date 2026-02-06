/**
 * Eagle Wallet - Wallets Screen
 * Manage multiple wallet accounts
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MultiWalletService from '../services/MultiWalletService';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

export default function WalletsScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>('');

  const loadWallets = async () => {
    try {
      const allWallets = await MultiWalletService.getAllWallets();
      setWallets(allWallets);
      
      const active = await MultiWalletService.getActiveWallet();
      if (active) {
        setActiveWalletId(active.id);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWallets();
    }, [])
  );

  const handleSwitchWallet = async (wallet: any) => {
    try {
      if (wallet.id === activeWalletId) return;

      // 1. Set as active in MultiWalletService
      await MultiWalletService.switchWallet(wallet.id);
      
      // 2. We need to unlock the wallet to use it in WalletService
      // Since we don't have the password here, we might need a prompt
      // But for now, let's assume we can switch if it's just switching the "view"
      // However, WalletService needs the private key to sign transactions.
      // Ideally, switching wallet should prompt for password if needed, 
      // or if we stored it in secure storage accessible via biometric/pin.
      
      // For this implementation, we will try to switch context
      setActiveWalletId(wallet.id);
      
      Alert.alert(
        t.common.success, 
        t.wallet.switchSuccess.replace('{name}', wallet.name),
        [
            {
                text: t.common.ok,
                onPress: () => navigation.goBack()
            }
        ]
      );
      
      // Note: In a real app, we would need to call WalletService.unlockWallet(password)
      // or similar mechanism. Since we can't easily get password here, 
      // we might need a "UnlockWalletModal" component. 
      // For now, updating the UI state is the first step.
      
    } catch (error) {
      Alert.alert(t.common.error, t.errors.switchWalletFailed);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.wallet.myWallets}</Text>
        <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddWallet')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {wallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={[
              styles.walletItem,
              wallet.id === activeWalletId && styles.activeWalletItem
            ]}
            onPress={() => handleSwitchWallet(wallet)}
          >
            <View style={[styles.walletIcon, { backgroundColor: wallet.color || '#F3BA2F' }]} />
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletAddress}>
                {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
              </Text>
            </View>
            {wallet.id === activeWalletId && (
              <Text style={styles.activeLabel}>{t.wallet.activeWallet}</Text>
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
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 10,
  },
  addButtonText: {
    color: '#F3BA2F',
    fontSize: 24,
  },
  content: {
    padding: 20,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  activeWalletItem: {
    borderColor: '#F3BA2F',
    backgroundColor: '#2A2A2A',
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  walletAddress: {
    color: '#999',
    fontSize: 12,
  },
  activeLabel: {
    color: '#F3BA2F',
    fontSize: 12,
    fontWeight: '600',
  },
});
