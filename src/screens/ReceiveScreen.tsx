/**
 * Eagle Wallet - Receive Screen
 * Display QR code and address for receiving tokens
 * Refined UI based on user feedback (White theme, large QR, Clean layout)
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import WalletService from '../services/WalletService';

const { width } = Dimensions.get('window');

export default function ReceiveScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const token = route.params?.token;
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(WalletService.getCurrentNetwork());
  
  // Use token symbol if available, otherwise network symbol
  const displaySymbol = token?.symbol || network.symbol;

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    const addr = await WalletService.getAddress();
    if (addr) {
      setAddress(addr);
    }
  };

  const copyAddress = () => {
    Clipboard.setString(address);
    Alert.alert(t.common.copied, t.receive.addressCopied);
  };

  const handleSetAmount = () => {
    Alert.alert(t.common.comingSoon, "Set amount feature coming soon");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrWrapper}>
             {address ? (
                <QRCode
                  value={address}
                  size={220}
                  backgroundColor="white"
                  color="black"
                  // logo={require('../assets/logo.png')} // Uncomment if logo exists
                  // logoSize={40}
                  // logoBackgroundColor='white'
                />
              ) : (
                <View style={[styles.qrPlaceholder, { width: 220, height: 220 }]} />
              )}
          </View>
          
          <Text style={styles.networkWarning}>
            {t.receive.onlyReceive.replace('{symbol}', `${network.name} (${network.symbol})`)}
          </Text>
        </View>

        {/* Address Info Section */}
        <View style={styles.addressSection}>
            <View style={styles.addressInfoLeft}>
                <Text style={styles.tokenSymbol}>{displaySymbol}</Text>
                <Text style={styles.addressText}>{address}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
                <Text style={styles.copyButtonText}>{t.common.copy}</Text>
            </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.setAmountButton} onPress={handleSetAmount}>
                <Text style={styles.setAmountText}>{t.receive.setAmount || 'Set Amount'}</Text>
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
    fontSize: 24,
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
    marginBottom: 20,
  },
  qrPlaceholder: {
    backgroundColor: '#F0F0F0',
  },
  networkWarning: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 'auto', // Push bottom actions down
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
