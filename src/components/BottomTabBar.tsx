import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const { width } = Dimensions.get('window');

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { t } = useLanguage();

  const tabs = [
    { key: 'wallet', label: t.home.myWallet, icon: '👛' },
    { key: 'swap', label: t.home.swap, icon: '🔁' },
    { key: 'ai', label: t.ai.title, icon: '🤖' },
    { key: 'dapps', label: t.dapp.discover, icon: '🧭' },
    { key: 'settings', label: t.settings.settings, icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingBottom: 20, // For iPhone X+ safe area
    paddingTop: 10,
    height: 85,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 4,
    padding: 6,
    borderRadius: 12,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(243, 186, 47, 0.15)',
  },
  icon: {
    fontSize: 24,
    color: '#999',
  },
  activeIcon: {
    color: '#F3BA2F',
  },
  label: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  activeLabel: {
    color: '#F3BA2F',
    fontWeight: '600',
  },
});


