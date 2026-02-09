import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './HomeScreen';
import SettingsScreen from './SettingsScreen';
import DAppBrowserScreen from './DAppBrowserScreen';
import SwapScreen from './SwapScreen';
import AIScreen from './AIScreen';
import BottomTabBar from '../components/BottomTabBar';

export default function MainScreen(props: any) {
  const [activeTab, setActiveTab] = useState('wallet');

  const renderContent = () => {
    switch (activeTab) {
      case 'wallet':
        return <HomeScreen {...props} isTabScreen={true} />;
      case 'swap':
        return <SwapScreen {...props} isTabScreen={true} />;
      case 'ai':
        return <AIScreen {...props} isTabScreen={true} />;
      case 'dapps':
        return <DAppBrowserScreen {...props} isTabScreen={true} />;
      case 'settings':
        return <SettingsScreen {...props} isTabScreen={true} />;
      default:
        return <HomeScreen {...props} isTabScreen={true} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    marginBottom: 85, // Height of BottomTabBar
  },
});
