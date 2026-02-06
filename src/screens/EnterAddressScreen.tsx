/**
 * Eagle Wallet - Enter Address Screen
 * Enter recipient address for sending tokens
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

export default function EnterAddressScreen({ route, navigation }: any) {
  const { token } = route.params || {};
  const [address, setAddress] = useState('');
  const [activeTab, setActiveTab] = useState('recent');

  // Mock data
  const recentAddresses = [
    { address: '0x89e4014569B9Bc7aE5AFD58e4227B3f2fB99c8a5', avatar: '🎨' },
    { address: '0x5D0BA3d652A768cA558C02eaAD51d8F926E3d555', avatar: '🎭' },
    { address: '0x647be98296AB3943Be46711d4a42382769ee0BB6', avatar: '🎪' },
    { address: '0x15FEd785ff1f4192094d678ecEd4DACb699ef783', avatar: '🎯' },
    { address: '0x04e2e260fb8108985a21cf9ed36cdc90a273afa4', avatar: '🎲' },
  ];

  const myWallets = [
    { name: '私钥', address: '0x4af7f86c70a6fba4ed9d49074d0805a3c63b1e5b', avatar: '🔐' },
  ];

  const handleNext = () => {
    if (address.length > 0) {
      navigation.navigate('EnterAmount', { token, address });
    }
  };

  const selectAddress = (addr: string) => {
    setAddress(addr);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>发送至</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="输入钱包地址或域名"
          placeholderTextColor="#999"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            最近使用
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            我的钱包
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'book' && styles.activeTab]}
          onPress={() => setActiveTab('book')}
        >
          <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>
            地址簿
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address List */}
      <ScrollView style={styles.addressList}>
        {activeTab === 'recent' && recentAddresses.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.addressItem}
            onPress={() => selectAddress(item.address)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </View>
            <Text style={styles.addressText}>{item.address}</Text>
          </TouchableOpacity>
        ))}

        {activeTab === 'my' && myWallets.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.addressItem}
            onPress={() => selectAddress(item.address)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>{item.name}</Text>
              <Text style={styles.addressText}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {activeTab === 'book' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>地址簿为空</Text>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, address.length === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={address.length === 0}
        >
          <Text style={styles.nextButtonText}>下一步</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  addressList: {
    flex: 1,
    padding: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    flex: 1,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
