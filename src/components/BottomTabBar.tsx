import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../i18n/LanguageContext';

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { t } = useLanguage();

  const tabs = [
    { key: 'wallet', label: t.home.myWallet, icon: 'wallet-outline' },
    { key: 'swap', label: t.home.swap, icon: 'swap-horizontal' },
    { key: 'ai', label: t.ai.title, icon: 'robot-outline' },
    { key: 'dapps', label: t.dapp.discover, icon: 'compass-outline' },
    { key: 'settings', label: t.settings.settings, icon: 'cog-outline' },
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
              <Icon
                name={tab.icon}
                size={22}
                color={isActive ? '#F3BA2F' : '#999'}
              />
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


