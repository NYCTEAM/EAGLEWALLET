/**
 * Eagle Wallet - Main App Entry
 * Simple, secure wallet for BSC and XLAYER
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import HomeScreen from './src/screens/HomeScreen';
import NFTScreen from './src/screens/NFTScreen';
import NFTDetailScreen from './src/screens/NFTDetailScreen';
import WalletService from './src/services/WalletService';

const Stack = createStackNavigator();

export default function App() {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    checkWallet();
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
            <Stack.Screen name="NFT" component={NFTScreen} />
            <Stack.Screen name="NFTDetail" component={NFTDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
