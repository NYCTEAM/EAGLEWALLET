/**
 * Eagle Wallet - Main App Entry
 * Simple, secure wallet for BSC and XLAYER
 */

import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, AppState } from 'react-native';
import { CommonActions, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import HomeScreen from './src/screens/HomeScreen';
import NFTScreen from './src/screens/NFTScreen';
import NFTDetailScreen from './src/screens/NFTDetailScreen';
import AIScreen from './src/screens/AIScreen';
import DAppBrowserScreen from './src/screens/DAppBrowserScreen';
import AddDAppScreen from './src/screens/AddDAppScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import ScanQRCodeScreen from './src/screens/ScanQRCodeScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ExportPrivateKeyScreen from './src/screens/ExportPrivateKeyScreen';
import RPCNodeScreen from './src/screens/RPCNodeScreen';
import TokenDetailScreen from './src/screens/TokenDetailScreen';
import SelectTokenScreen from './src/screens/SelectTokenScreen';
import EnterAddressScreen from './src/screens/EnterAddressScreen';
import EnterAmountScreen from './src/screens/EnterAmountScreen';
import SendConfirmationScreen from './src/screens/SendConfirmationScreen';
import TransactionResultScreen from './src/screens/TransactionResultScreen';
import WalletsScreen from './src/screens/WalletsScreen';
import AddWalletScreen from './src/screens/AddWalletScreen';
import AddTokenScreen from './src/screens/AddTokenScreen';
import ManageTokensScreen from './src/screens/ManageTokensScreen';
import SwapScreen from './src/screens/SwapScreen';
import AdvancedSettingsScreen from './src/screens/AdvancedSettingsScreen';
import PriceAlertScreen from './src/screens/PriceAlertScreen';
import DAppWebViewScreen from './src/screens/DAppWebViewScreen';
import LanguageSettingsScreen from './src/screens/LanguageSettingsScreen';
import BackupWalletScreen from './src/screens/BackupWalletScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import WalletService from './src/services/WalletService';
import ApiBaseService from './src/services/ApiBaseService';
import RewardsDappService from './src/services/RewardsDappService';
import RPCService from './src/services/RPCService';
import PriceService from './src/services/PriceService';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import BottomTabBar from './src/components/BottomTabBar';

const Stack = createStackNavigator();

function AppLoading() {
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
      <ActivityIndicator size="large" color="#F3BA2F" />
      <Text style={{ marginTop: 20, color: '#333' }}>{t.common.loading}</Text>
    </View>
  );
}

export default function App() {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const navigationRef = useNavigationContainerRef();
  const [activeTab, setActiveTab] = useState<'wallet' | 'swap' | 'ai' | 'dapps' | 'settings'>('wallet');

  useEffect(() => {
    const runCheck = async () => {
      try {
        const exists = await WalletService.hasWallet();
        setHasWallet(exists);
      } catch (error) {
        console.error('App: wallet check failed', error);
        setHasWallet(false);
      }
    };

    runCheck();
    const interval = setInterval(runCheck, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    ApiBaseService.prewarm();
    RewardsDappService.prewarm();
  }, []);

  useEffect(() => {
    if (!hasWallet) return;
    const warm = async () => {
      try {
        const network = WalletService.getCurrentNetwork();
        await WalletService.getBalance();
        await PriceService.getTokenPriceBySymbol(network.symbol, network.chainId);
      } catch {
        // silent prewarm
      }
    };
    warm();
  }, [hasWallet]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isActive = true;

    const refreshRpc = async () => {
      if (!isActive) return;
      const chainId = WalletService.getCurrentNetwork().chainId;
      try {
        await RPCService.refreshNodes(chainId);
        await WalletService.ensurePreferredProvider(true);
      } catch (error) {
        console.warn('RPC auto-refresh failed:', error);
      }
    };

    const start = () => {
      if (interval) return;
      refreshRpc();
      interval = setInterval(refreshRpc, 180000);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    start();
    const sub = AppState.addEventListener('change', (state) => {
      isActive = state === 'active';
      if (isActive) {
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      sub.remove();
    };
  }, []);

  if (hasWallet === null) {
    return (
      <LanguageProvider>
        <AppLoading />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1 }}>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              const routeName = navigationRef.getCurrentRoute()?.name;
              if (routeName === 'Swap') setActiveTab('swap');
              else if (routeName === 'AI') setActiveTab('ai');
              else if (routeName === 'DAppBrowser') setActiveTab('dapps');
              else if (routeName === 'Settings') setActiveTab('settings');
              else setActiveTab('wallet');
            }}
            onStateChange={() => {
              const routeName = navigationRef.getCurrentRoute()?.name;
              if (!routeName) return;
              if (routeName === 'Swap') setActiveTab('swap');
              else if (routeName === 'AI') setActiveTab('ai');
              else if (routeName === 'DAppBrowser') setActiveTab('dapps');
              else if (routeName === 'Settings') setActiveTab('settings');
              else if (routeName === 'Home') setActiveTab('wallet');
              // For nested flows (Send/Receive/TokenDetail/etc), keep the last tab selected.
            }}
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!hasWallet ? (
                <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
              ) : (
                <>
                  <Stack.Screen name="Home">
                    {(props) => <HomeScreen {...props} isTabScreen={true} />}
                  </Stack.Screen>
                  <Stack.Screen name="Swap">
                    {(props) => <SwapScreen {...props} isTabScreen={true} />}
                  </Stack.Screen>
                  <Stack.Screen name="AI" component={AIScreen} />
                  <Stack.Screen name="DAppBrowser">
                    {(props) => <DAppBrowserScreen {...props} isTabScreen={true} />}
                  </Stack.Screen>
                  <Stack.Screen name="Settings">
                    {(props) => <SettingsScreen {...props} isTabScreen={true} />}
                  </Stack.Screen>

                  <Stack.Screen name="Send" component={SendScreen} />
                  <Stack.Screen name="ScanQRCode" component={ScanQRCodeScreen} />
                  <Stack.Screen name="Receive" component={ReceiveScreen} />
                  <Stack.Screen name="NFT" component={NFTScreen} />
                  <Stack.Screen name="NFTDetail" component={NFTDetailScreen} />
                  <Stack.Screen name="AddDApp" component={AddDAppScreen} />
                  <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                  <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
                  <Stack.Screen name="ExportPrivateKey" component={ExportPrivateKeyScreen} />
                  <Stack.Screen name="RPCNode" component={RPCNodeScreen} />
                  <Stack.Screen name="TokenDetail" component={TokenDetailScreen} />
                  <Stack.Screen name="SelectToken" component={SelectTokenScreen} />
                  <Stack.Screen name="EnterAddress" component={EnterAddressScreen} />
                  <Stack.Screen name="EnterAmount" component={EnterAmountScreen} />
                  <Stack.Screen name="SendConfirmation" component={SendConfirmationScreen} />
                  <Stack.Screen name="TransactionResult" component={TransactionResultScreen} />
                  <Stack.Screen name="Wallets" component={WalletsScreen} />
                  <Stack.Screen name="AddWallet" component={AddWalletScreen} />
                  <Stack.Screen name="AddToken" component={AddTokenScreen} />
                  <Stack.Screen name="ManageTokens" component={ManageTokensScreen} />
                  <Stack.Screen name="AdvancedSettings" component={AdvancedSettingsScreen} />
                  <Stack.Screen name="PriceAlert" component={PriceAlertScreen} />
                  <Stack.Screen name="DAppWebView" component={DAppWebViewScreen} />
                  <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                  <Stack.Screen name="BackupWallet" component={BackupWalletScreen} />
                  <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </View>

        {hasWallet && (
          <BottomTabBar
            activeTab={activeTab}
            onTabPress={(tab) => {
              setActiveTab(tab as any);
              if (!navigationRef.isReady()) return;

              const target =
                tab === 'swap'
                  ? 'Swap'
                  : tab === 'ai'
                    ? 'AI'
                    : tab === 'dapps'
                      ? 'DAppBrowser'
                      : tab === 'settings'
                        ? 'Settings'
                        : 'Home';

              navigationRef.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: target }],
                }),
              );
            }}
          />
        )}
      </View>
    </LanguageProvider>
  );
}
