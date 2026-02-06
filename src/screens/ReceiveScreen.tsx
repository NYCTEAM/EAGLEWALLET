/**
 * Eagle Wallet - Receive Screen
 * Display QR code and address for receiving tokens
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
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import WalletService from '../services/WalletService';

export default function ReceiveScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(WalletService.getCurrentNetwork());

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

  const shareAddress = async () => {
    try {
      await Share.share({
        message: `${t.receive.myAddress} (${network.name}):\n${address}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.receive.receive} {network.symbol}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Network Badge */}
        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>{network.name}</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          {address ? (
            <QRCode
              value={address}
              size={250}
              backgroundColor="white"
              color="black"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text>{t.common.loading}</Text>
            </View>
          )}
        </View>

        {/* Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>{t.receive.myAddress}</Text>
          <Text style={styles.addressText}>{address}</Text>
          <Text style={styles.addressShort}>{formatAddress(address)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyAddress}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>{t.receive.copyAddress}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>{t.common.share}</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ {t.common.warning}</Text>
          <Text style={styles.warningText}>
            • {t.receive.onlyReceive.replace('{symbol}', network.symbol)}
          </Text>
          <Text style={styles.warningText}>
            • {t.receive.warningMessage}
          </Text>
        </View>

        {/* Network Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.network.network}</Text>
            <Text style={styles.infoValue}>{network.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.network.chainId}</Text>
            <Text style={styles.infoValue}>{network.chainId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.network.symbol}</Text>
            <Text style={styles.infoValue}>{network.symbol}</Text>
          </View>
        </View>
      </View>
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
    padding: 20,
    alignItems: 'center',
  },
  networkBadge: {
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  networkText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  addressContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 11,
    color: '#000',
    fontFamily: 'monospace',
    marginBottom: 8,
    textAlign: 'center',
  },
  addressShort: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  warningBox: {
    width: '100%',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 20,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
});
