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
import WalletService from '../services/WalletService';
import CustomTokenService, { CustomToken } from '../services/CustomTokenService';
import { useLanguage } from '../i18n/LanguageContext';
import { ethers } from 'ethers';

export default function AddTokenScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedToken, setDetectedToken] = useState<CustomToken | null>(null);

  const network = WalletService.getCurrentNetwork();

  const detectToken = async () => {
    if (!address.trim()) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    if (!ethers.isAddress(address.trim())) {
      Alert.alert(t.common.error, t.token.invalidTokenAddress);
      return;
    }

    setLoading(true);
    try {
      const provider = await WalletService.getProvider();
      const token = await CustomTokenService.getTokenInfo(address.trim(), network.chainId, provider);
      setDetectedToken(token);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.invalidInput);
    } finally {
      setLoading(false);
    }
  };

  const addToken = async () => {
    if (!detectedToken) {
      return;
    }

    setLoading(true);
    try {
      await CustomTokenService.addCustomToken(detectedToken);
      Alert.alert(t.common.success, t.token.tokenAdded, [
        {
          text: t.common.done,
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      const message = String(error?.message || '');
      const displayMessage = message.toLowerCase().includes('already added')
        ? t.token.tokenAlreadyAdded
        : (error?.message || t.errors.unknownError);
      Alert.alert(t.common.error, displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.token.addToken}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.network}>{t.settings.network}: {network.name}</Text>

        <Text style={styles.label}>{t.token.tokenAddress}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          placeholder="0x..."
          placeholderTextColor="#8992A8"
        />

        <TouchableOpacity style={styles.button} onPress={detectToken} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? t.common.loading : t.common.search}</Text>
        </TouchableOpacity>

        {detectedToken ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{t.token.tokenDetails}</Text>
            <Text style={styles.previewItem}>{t.token.tokenName}: {detectedToken.name}</Text>
            <Text style={styles.previewItem}>{t.token.tokenSymbol}: {detectedToken.symbol}</Text>
            <Text style={styles.previewItem}>{t.token.tokenDecimals}: {detectedToken.decimals}</Text>
            <Text style={styles.previewItem}>{t.nft.standard}: {detectedToken.type}</Text>

            <TouchableOpacity style={[styles.button, styles.addButton]} onPress={addToken} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? t.common.loading : t.token.importToken}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
  },
  back: {
    color: '#E9B949',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  network: {
    color: '#A6AEC3',
    marginBottom: 12,
    fontSize: 13,
  },
  label: {
    color: '#D8DEEE',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#181818',
    fontWeight: '700',
    fontSize: 14,
  },
  previewCard: {
    marginTop: 16,
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 12,
    padding: 12,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewItem: {
    color: '#C7CEE2',
    marginBottom: 4,
    fontSize: 13,
  },
  addButton: {
    marginTop: 12,
  },
});
