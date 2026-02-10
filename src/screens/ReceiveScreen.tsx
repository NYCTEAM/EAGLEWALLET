/**
 * Eagle Wallet - Receive Screen
 * Display QR code and address for receiving tokens
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function ReceiveScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const token = route?.params?.token;
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [qrFailed, setQrFailed] = useState(false);
  const [network] = useState(WalletService.getCurrentNetwork());

  const displaySymbol = token?.symbol || network?.symbol || 'BNB';
  const networkLabel = `${network?.name || 'BNB Smart Chain'} (${network?.symbol || 'BNB'})`;
  const commonText = t.common || {};
  const receiveText = t.receive || {};
  const errorText = t.errors || {};
  const receiveTemplate = receiveText.onlyReceive || 'Only receive {symbol} on this address';
  const receiveHint = receiveTemplate.includes('{symbol}')
    ? receiveTemplate.replace('{symbol}', networkLabel)
    : `${receiveTemplate} ${networkLabel}`;
  const shareLabel = receiveText.share || 'Share';
  const qrImageUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(address)}`
    : '';

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const addr = await WalletService.getAddress();
        if (addr) {
          setAddress(addr);
        }
      } finally {
        setLoadingAddress(false);
      }
    };

    loadAddress();
  }, []);

  const copyAddress = () => {
    if (!address) {
      Alert.alert(commonText.error || 'Error', errorText.unknownError || 'Address unavailable');
      return;
    }
    Clipboard.setString(address);
    Alert.alert(commonText.copied || 'Copied', receiveText.addressCopied || 'Address copied');
  };

  const shareAddress = () => {
    if (!address) {
      Alert.alert(commonText.error || 'Error', errorText.unknownError || 'Address unavailable');
      return;
    }

    Share.share({
      title: receiveText.shareAddress || 'Share Address',
      message: `${displaySymbol} (${network?.name || 'BNB Smart Chain'})\n${address}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeIcon}>X</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <View style={styles.qrWrapper}>
            {loadingAddress ? (
              <View style={styles.qrCenter}>
                <ActivityIndicator size="large" color="#222222" />
              </View>
            ) : address && !qrFailed ? (
              <Image
                source={{ uri: qrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
                onError={() => setQrFailed(true)}
              />
            ) : (
              <View style={[styles.qrPlaceholder, styles.qrCenter]}>
                <Text style={styles.placeholderText}>QR unavailable</Text>
              </View>
            )}
          </View>

          <Text style={styles.networkWarning}>{receiveHint}</Text>
        </View>

        <View style={styles.addressSection}>
          <View style={styles.addressInfoLeft}>
            <Text style={styles.tokenSymbol}>{displaySymbol}</Text>
            <Text style={styles.addressText}>{address || 'Loading address...'}</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
            <Text style={styles.copyButtonText}>{commonText.copy || 'Copy'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.setAmountButton} onPress={shareAddress}>
            <Text style={styles.setAmountText}>{shareLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 10,
  },
  closeIcon: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 20,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: '#F0F0F0',
  },
  qrCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#777',
  },
  networkWarning: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    width: Math.min(width - 80, 320),
  },
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 'auto',
  },
  addressInfoLeft: {
    flex: 1,
    paddingRight: 20,
  },
  tokenSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  copyButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  copyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActions: {
    width: '100%',
    paddingBottom: 40,
  },
  setAmountButton: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  setAmountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
