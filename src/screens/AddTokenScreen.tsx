/**
 * Eagle Wallet - Add Token Screen
 * Add custom ERC20/721/1155 tokens
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import CustomTokenService from '../services/CustomTokenService';
import WalletService from '../services/WalletService';

export default function AddTokenScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [contractAddress, setContractAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const handleSearch = async () => {
    if (!contractAddress || contractAddress.length !== 42) {
      Alert.alert('Error', 'Please enter a valid contract address');
      return;
    }

    try {
      setLoading(true);
      const provider = await WalletService.getProvider();
      const network = WalletService.getCurrentNetwork();
      
      const info = await CustomTokenService.getTokenInfo(
        contractAddress,
        network.chainId,
        provider
      );
      
      setTokenInfo(info);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch token information');
      setTokenInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!tokenInfo) return;

    try {
      await CustomTokenService.addCustomToken(tokenInfo);
      Alert.alert('Success', 'Token added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add token');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>â†?Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Token</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Contract Address</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            value={contractAddress}
            onChangeText={setContractAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.searchButtonText}>Search Token</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Token Info */}
        {tokenInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Token Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{tokenInfo.name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Symbol</Text>
                <Text style={styles.infoValue}>{tokenInfo.symbol}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{tokenInfo.type}</Text>
              </View>
              
              {tokenInfo.type === 'ERC20' && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Decimals</Text>
                  <Text style={styles.infoValue}>{tokenInfo.decimals}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contract</Text>
                <Text style={styles.infoValueSmall} numberOfLines={1}>
                  {tokenInfo.address}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToken}
            >
              <Text style={styles.addButtonText}>Add Token</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>ðŸ’¡ How to add a token:</Text>
          <Text style={styles.helpText}>
            1. Get the token's contract address from BSCScan or the project website
          </Text>
          <Text style={styles.helpText}>
            2. Paste the address above and tap "Search Token"
          </Text>
          <Text style={styles.helpText}>
            3. Verify the token information
          </Text>
          <Text style={styles.helpText}>
            4. Tap "Add Token" to add it to your wallet
          </Text>
        </View>

        {/* Popular Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Tokens</Text>
          <Text style={styles.comingSoon}>Coming soon...</Text>
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
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  helpBox: {
    backgroundColor: '#FFF9E6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3BA2F',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  comingSoon: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
