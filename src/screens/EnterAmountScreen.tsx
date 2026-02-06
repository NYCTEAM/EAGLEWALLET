/**
 * Eagle Wallet - Enter Amount Screen
 * Enter amount to send
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

export default function EnterAmountScreen({ route, navigation }: any) {
  const { token, address } = route.params || {};
  const [amount, setAmount] = useState('0');
  const [usdValue, setUsdValue] = useState('0.00');

  const maxBalance = token?.amount || '7,727.08';

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    
    // Calculate USD value (mock calculation)
    const numValue = parseFloat(cleaned) || 0;
    setUsdValue((numValue * 1.0).toFixed(2));
  };

  const handleMax = () => {
    const cleanMax = maxBalance.replace(/,/g, '');
    setAmount(cleanMax);
    const numValue = parseFloat(cleanMax) || 0;
    setUsdValue((numValue * 1.0).toFixed(2));
  };

  const handleNext = () => {
    if (parseFloat(amount) > 0) {
      navigation.navigate('SendConfirmation', { token, address, amount });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>发送</Text>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.amountSection}>
        <View style={styles.amountInputContainer}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#E0E0E0"
          />
          <Text style={styles.tokenSymbol}>{token?.symbol || 'USDT'}</Text>
        </View>
        <Text style={styles.usdValue}>{usdValue} USD ▼</Text>
      </View>

      {/* Balance */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceLeft}>
            <View style={[styles.tokenIcon, { backgroundColor: token?.color + '20' || '#26A17B20' }]}>
              <Text style={styles.tokenIconText}>{token?.icon || '₮'}</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>余额</Text>
              <Text style={styles.balanceAmount}>{maxBalance} {token?.symbol || 'USDT'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
            <Text style={styles.maxButtonText}>最大</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, parseFloat(amount) === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={parseFloat(amount) === 0}
        >
          <Text style={styles.nextButtonText}>下一步</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#000',
    minWidth: 100,
    textAlign: 'right',
  },
  tokenSymbol: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  usdValue: {
    fontSize: 18,
    color: '#999',
  },
  balanceSection: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  maxButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
