/**
 * Eagle Wallet - Main App Entry
 * Simple, secure wallet for BSC and XLAYER
 */

import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import MainScreen from './src/screens/MainScreen';
import NFTScreen from './src/screens/NFTScreen';
import NFTDetailScreen from './src/screens/NFTDetailScreen';
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
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';

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

  if (hasWallet === null) {
    return (
      <LanguageProvider>
        <AppLoading />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!hasWallet ? (
            <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={MainScreen} />
              <Stack.Screen name="Send" component={SendScreen} />
              <Stack.Screen name="ScanQRCode" component={ScanQRCodeScreen} />
              <Stack.Screen name="Receive" component={ReceiveScreen} />
              <Stack.Screen name="NFT" component={NFTScreen} />
              <Stack.Screen name="NFTDetail" component={NFTDetailScreen} />
              <Stack.Screen name="DAppBrowser" component={DAppBrowserScreen} />
              <Stack.Screen name="AddDApp" component={AddDAppScreen} />
              <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
              <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
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
              <Stack.Screen name="Swap" component={SwapScreen} />
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
    </LanguageProvider>
  );
}
