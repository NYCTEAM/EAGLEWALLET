/**
 * Eagle Wallet - Send Transaction Screen
 * Send tokens with transaction history and confirmation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import WalletService from '../services/WalletService';

export default function SendScreen({ navigation }: any) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState('5');
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(WalletService.getCurrentNetwork());

  React.useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const bal = await WalletService.getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const validateInputs = (): boolean => {
    if (!recipientAddress || recipientAddress.length !== 42 || !recipientAddress.startsWith('0x')) {
      Alert.alert('Error', 'Please enter a valid address (0x...)');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    const balanceNum = parseFloat(balance);
    if (amountNum > balanceNum) {
      Alert.alert('Error', 'Insufficient balance');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ${network.symbol} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSending(true);
              const txHash = await WalletService.sendTransaction(recipientAddress, amount);
              
              Alert.alert(
                'Success',
                `Transaction sent!\n\nHash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
                [
                  {
                    text: 'View Details',
                    onPress: () => navigation.navigate('TransactionDetail', { txHash }),
                  },
                  {
                    text: 'Done',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Transaction failed');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const setMaxAmount = () => {
    const balanceNum = parseFloat(balance);
    // Reserve some for gas
    const maxAmount = Math.max(0, balanceNum - 0.001);
    setAmount(maxAmount.toString());
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send {network.symbol}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {parseFloat(balance).toFixed(6)} {network.symbol}
          </Text>
          <Text style={styles.balanceNetwork}>{network.name}</Text>
        </View>

        {/* Recipient Address */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.scanButton}>
            <Text style={styles.scanButtonText}>📷 Scan QR</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Amount</Text>
            <TouchableOpacity onPress={setMaxAmount}>
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.amountSymbol}>{network.symbol}</Text>
          </View>
        </View>

        {/* Gas Price */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Gas Price (Gwei)</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={gasPrice}
            onChangeText={setGasPrice}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Higher gas = faster transaction</Text>
        </View>

        {/* Transaction Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{amount || '0'} {network.symbol}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee (est.)</Text>
            <Text style={styles.summaryValue}>~0.0001 {network.symbol}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabelBold}>Total</Text>
            <Text style={styles.summaryValueBold}>
              {(parseFloat(amount || '0') + 0.0001).toFixed(6)} {network.symbol}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.sendButtonText}>Send Transaction</Text>
          )}
        </TouchableOpacity>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Double-check the recipient address. Transactions cannot be reversed.
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
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  balanceNetwork: {
    fontSize: 12,
    color: '#999',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxButton: {
    fontSize: 14,
    color: '#F3BA2F',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scanButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 14,
    color: '#666',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingRight: 16,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
  },
  amountSymbol: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#F3BA2F',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
});
