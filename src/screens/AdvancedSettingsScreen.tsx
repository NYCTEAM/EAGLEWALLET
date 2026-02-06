/**
 * Eagle Wallet - Advanced Settings Screen
 * Advanced configuration options
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdvancedSettingsScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [showTestnets, setShowTestnets] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      t.dapp.clearCache,
      t.dapp.cacheClearConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.dapp.clearCache,
          style: 'destructive',
          onPress: async () => {
            // Clear cache logic
            Alert.alert(t.common.success, t.dapp.cacheCleared);
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      t.settings.advancedSettings,
      t.settings.resetMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert(t.common.success, t.settings.appReset);
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.advancedSettings}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Network */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.network.network}</Text>

          <SettingItem
            icon="🔌"
            title={t.settings.displayTestnet}
            subtitle={t.settings.displayTestnet}
            rightElement={
              <Switch
                value={showTestnets}
                onValueChange={setShowTestnets}
                trackColor={{ false: '#E0E0E0', true: '#F3BA2F' }}
              />
            }
          />
        </View>

        {/* Developer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.advanced}</Text>

          <SettingItem
            icon="👨‍💻"
            title={t.settings.advancedSettingsSubtitle}
            subtitle={t.settings.enableAdvanced}
            rightElement={
              <Switch
                value={developerMode}
                onValueChange={setDeveloperMode}
                trackColor={{ false: '#E0E0E0', true: '#F3BA2F' }}
              />
            }
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.security}</Text>

          <SettingItem
            icon="🔒"
            title={t.settings.autoLock}
            subtitle={t.settings.autoLockSubtitle}
            rightElement={
              <Switch
                value={autoLockEnabled}
                onValueChange={setAutoLockEnabled}
                trackColor={{ false: '#E0E0E0', true: '#F3BA2F' }}
              />
            }
          />
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.privacyPolicy}</Text>

          <SettingItem
            icon="📊"
            title={t.settings.analytics}
            subtitle={t.settings.analyticsSubtitle}
            rightElement={
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#F3BA2F' }}
              />
            }
          />
        </View>

        {/* Maintenance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.advanced}</Text>

          <SettingItem
            icon="🧹"
            title={t.dapp.clearCache}
            subtitle={t.settings.clearCacheSubtitle}
            onPress={handleClearCache}
            rightElement={<Text style={styles.arrow}>→</Text>}
          />

          <SettingItem
            icon="🔧"
            title={t.settings.resetApp}
            subtitle={t.settings.resetAppSubtitle}
            onPress={handleResetApp}
            rightElement={<Text style={styles.arrow}>→</Text>}
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t.settings.advancedWarning}
          </Text>
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
    fontSize: 12,
    color: '#666',
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3BA2F',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
