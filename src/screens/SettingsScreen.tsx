/**
 * Eagle Wallet - Settings Screen
 * App settings including language, security, and wallet management
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';
import BiometricAuthService from '../services/BiometricAuthService';

type ItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
};

export default function SettingsScreen({ navigation, isTabScreen }: any) {
  const { t, language, availableLanguages } = useLanguage();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const network = WalletService.getCurrentNetwork();

  const currentLanguage =
    availableLanguages.find((lang) => lang.code === language)?.nativeName || 'English';

  useEffect(() => {
    const loadSecurityPreferences = async () => {
      const [enabled, available] = await Promise.all([
        BiometricAuthService.isEnabled(),
        BiometricAuthService.isAvailable(),
      ]);
      setBiometricEnabled(enabled);
      setBiometricAvailable(available);
    };

    loadSecurityPreferences();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    try {
      await BiometricAuthService.setEnabled(value);
      setBiometricEnabled(value);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    }
  };

  const handleExportPrivateKey = () => {
    Alert.alert(t.settings.exportPrivateKeyTitle, t.settings.exportPrivateKeyMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.show,
        style: 'destructive',
        onPress: () => navigation.navigate('ExportPrivateKey'),
      },
    ]);
  };

  const handleBackupWallet = () => {
    Alert.alert(t.settings.backupWalletTitle, t.settings.backupWalletMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.showRecoveryPhrase,
        onPress: () => navigation.navigate('BackupWallet'),
      },
    ]);
  };

  const handleDeleteWallet = () => {
    Alert.alert(t.settings.deleteWalletTitle, t.settings.deleteWalletMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await WalletService.deleteWallet();
          navigation.replace('CreateWallet');
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightElement,
  }: ItemProps) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightElement || (showArrow && <Text style={styles.settingArrow}>{'>'}</Text>)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isTabScreen ? (
          <View style={{ width: 60 }} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{`< ${t.settings.back}`}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t.settings.settings}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.walletManagement}</Text>
          <SettingItem
            icon="W"
            title={t.settings.myWallets}
            subtitle={t.settings.myWalletsSubtitle}
            onPress={() => navigation.navigate('Wallets')}
          />
          <SettingItem
            icon="+"
            title={t.settings.addCustomToken}
            subtitle={t.settings.addCustomTokenSubtitle}
            onPress={() => navigation.navigate('AddToken')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.network}</Text>
          <SettingItem icon="N" title={t.settings.currentNetwork} subtitle={network.name} showArrow={false} />
          <SettingItem
            icon="R"
            title={t.settings.rpcNodes}
            subtitle={t.settings.rpcNodesSubtitle}
            onPress={() => navigation.navigate('RPCNode', { chainId: network.chainId })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.security}</Text>
          <SettingItem
            icon="B"
            title={t.settings.biometricAuth}
            subtitle={biometricAvailable ? t.settings.biometricAuthSubtitle : 'Not available on this device'}
            showArrow={false}
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                disabled={!biometricAvailable}
                trackColor={{ false: '#E0E0E0', true: '#F3BA2F' }}
              />
            }
          />
          <SettingItem
            icon="K"
            title={t.settings.exportPrivateKey}
            subtitle={t.settings.exportPrivateKeySubtitle}
            onPress={handleExportPrivateKey}
          />
          <SettingItem
            icon="S"
            title={t.settings.backupWallet}
            subtitle={t.settings.backupWalletSubtitle}
            onPress={handleBackupWallet}
          />
          <SettingItem
            icon="P"
            title={t.settings.changePassword}
            subtitle={t.settings.changePasswordSubtitle}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.advanced}</Text>
          <SettingItem
            icon="A"
            title={t.settings.priceAlerts}
            subtitle={t.settings.priceAlertsSubtitle}
            onPress={() => navigation.navigate('PriceAlert')}
          />
          <SettingItem
            icon="D"
            title={t.settings.advancedSettings}
            subtitle={t.settings.advancedSettingsSubtitle}
            onPress={() => navigation.navigate('AdvancedSettings')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.preferences}</Text>
          <SettingItem
            icon="L"
            title={t.settings.language}
            subtitle={currentLanguage}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          <SettingItem
            icon="$"
            title={t.settings.currency}
            subtitle={currency}
            onPress={() => {
              Alert.alert(t.settings.currency, t.settings.chooseCurrency, [
                { text: 'USD', onPress: () => setCurrency('USD') },
                { text: 'EUR', onPress: () => setCurrency('EUR') },
                { text: 'CNY', onPress: () => setCurrency('CNY') },
                { text: t.common.cancel, style: 'cancel' },
              ]);
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.about}</Text>
          <SettingItem icon="V" title={t.settings.version} subtitle="1.0.0" showArrow={false} />
          <SettingItem icon="T" title={t.settings.termsOfService} showArrow={false} />
          <SettingItem icon="P" title={t.settings.privacyPolicy} showArrow={false} />
          <SettingItem
            icon="H"
            title={t.settings.support}
            subtitle={t.settings.supportSubtitle}
            showArrow={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t.settings.dangerZone}</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteWallet}>
            <Text style={styles.dangerIcon}>!</Text>
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle2}>{t.settings.deleteWallet}</Text>
              <Text style={styles.dangerSubtitle}>{t.settings.deleteWalletSubtitle}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Eagle Wallet</Text>
          <Text style={styles.footerSubtext}>Secure BSC Wallet</Text>
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
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
    color: '#2F3550',
    width: 18,
    textAlign: 'center',
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
    fontWeight: '800',
    marginRight: 12,
    color: '#E53935',
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
