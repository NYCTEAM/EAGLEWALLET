/**
 * Eagle Wallet - Main App Entry
 * Simple, secure wallet for BSC and XLAYER
 */

// Import polyfills for crypto
import 'react-native-get-random-values';

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import HomeScreen from './src/screens/HomeScreen';
import NFTScreen from './src/screens/NFTScreen';
import NFTDetailScreen from './src/screens/NFTDetailScreen';
import DAppBrowserScreen from './src/screens/DAppBrowserScreen';
import AddDAppScreen from './src/screens/AddDAppScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
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
import WalletService from './src/services/WalletService';

const Stack = createStackNavigator();

export default function App() {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    checkWallet();
    
    // Check wallet status every 500ms to detect when wallet is created
    const interval = setInterval(checkWallet, 500);
    return () => clearInterval(interval);
  }, []);

  const checkWallet = async () => {
    const exists = await WalletService.hasWallet();
    setHasWallet(exists);
  };

  if (hasWallet === null) {
    return null; // Loading
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!hasWallet ? (
          <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Send" component={SendScreen} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
