/**
 * Eagle Wallet - Settings Screen
 * App settings including language, security, and wallet management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import WalletService from '../services/WalletService';

export default function SettingsScreen({ navigation }: any) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');
  const network = WalletService.getCurrentNetwork();

  const handleExportPrivateKey = () => {
    Alert.alert(
      'Export Private Key',
      'Your private key gives full access to your wallet. Never share it with anyone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show',
          style: 'destructive',
          onPress: () => {
            // Navigate to export screen
            navigation.navigate('ExportPrivateKey');
          },
        },
      ]
    );
  };

  const handleBackupWallet = () => {
    Alert.alert(
      'Backup Wallet',
      'Write down your recovery phrase and store it safely',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Recovery Phrase',
          onPress: () => {
            navigation.navigate('BackupWallet');
          },
        },
      ]
    );
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure? Make sure you have backed up your recovery phrase!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await WalletService.deleteWallet();
            navigation.replace('CreateWallet');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightElement,
  }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (showArrow && <Text style={styles.settingArrow}>→</Text>)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Network Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <SettingItem
            icon="🌐"
            title="Current Network"
            subtitle={network.name}
            onPress={() => {}}
            showArrow={false}
          />
          <SettingItem
            icon="🔌"
            title="RPC Nodes"
            subtitle="View and test connection speed"
            onPress={() => navigation.navigate('RPCNode', { chainId: network.chainId })}
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <SettingItem
            icon="🔐"
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID"
            showArrow={false}
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E0E0E0', true: '#F3BA2F' }}
              />
            }
          />
          
          <SettingItem
            icon="🔑"
            title="Export Private Key"
            subtitle="View your private key"
            onPress={handleExportPrivateKey}
          />
          
          <SettingItem
            icon="📝"
            title="Backup Wallet"
            subtitle="View recovery phrase"
            onPress={handleBackupWallet}
          />
          
          <SettingItem
            icon="🔒"
            title="Change Password"
            subtitle="Update wallet password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingItem
            icon="🌍"
            title="Language"
            subtitle={language}
            onPress={() => {
              Alert.alert('Language', 'Choose language', [
                { text: 'English', onPress: () => setLanguage('English') },
                { text: '中文', onPress: () => setLanguage('中文') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          
          <SettingItem
            icon="💱"
            title="Currency"
            subtitle={currency}
            onPress={() => {
              Alert.alert('Currency', 'Choose currency', [
                { text: 'USD', onPress: () => setCurrency('USD') },
                { text: 'EUR', onPress: () => setCurrency('EUR') },
                { text: 'CNY', onPress: () => setCurrency('CNY') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            icon="📱"
            title="Version"
            subtitle="1.0.0"
            showArrow={false}
          />
          
          <SettingItem
            icon="📄"
            title="Terms of Service"
            onPress={() => {}}
          />
          
          <SettingItem
            icon="🔒"
            title="Privacy Policy"
            onPress={() => {}}
          />
          
          <SettingItem
            icon="💬"
            title="Support"
            subtitle="Get help"
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteWallet}
          >
            <Text style={styles.dangerIcon}>🗑️</Text>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle2}>Delete Wallet</Text>
              <Text style={styles.dangerSubtitle}>
                Permanently remove wallet from this device
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Eagle Wallet</Text>
          <Text style={styles.footerSubtext}>Secure BSC & XLAYER Wallet</Text>
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
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingArrow: {
    fontSize: 20,
    color: '#999',
  },
  dangerTitle: {
    color: '#E53935',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dangerText: {
    flex: 1,
  },
  dangerTitle2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
    marginBottom: 2,
  },
  dangerSubtitle: {
    fontSize: 13,
    color: '#E57373',
  },
  footer: {
    alignItems: 'center',
    padding: 40,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
