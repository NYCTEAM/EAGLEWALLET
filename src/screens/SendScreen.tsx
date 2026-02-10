/**
 * Eagle Wallet - Send Screen
 * Send crypto to another address
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ethers } from 'ethers';
import WalletService from '../services/WalletService';
import MultiWalletService from '../services/MultiWalletService';
import NFTService from '../services/NFTService';
import { useLanguage } from '../i18n/LanguageContext';
import { NFT } from '../services/NFTService';

export default function SendScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const sendToken = route.params?.token;
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState('5');
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState('0');
  const [myWallets, setMyWallets] = useState<any[]>([]);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  // Get initial params if any (e.g. from scan or NFT detail)
  const initialAddress = route.params?.address || '';
  const nft: NFT | undefined = route.params?.nft;
  
  useEffect(() => {
    if (initialAddress) {
      setRecipientAddress(initialAddress);
    }
    loadBalance();
    loadWallets();
  }, [initialAddress, sendToken]);

  const loadBalance = async () => {
    if (sendToken?.balance !== undefined && sendToken?.balance !== null) {
      setBalance(String(sendToken.balance));
      return;
    }
    const bal = await WalletService.getBalance();
    setBalance(bal);
  };

  const loadWallets = async () => {
    const wallets = await MultiWalletService.getAllWallets();
    setMyWallets(wallets);
  };

  const network = WalletService.getCurrentNetwork();

  const handleSend = async () => {
    const to = recipientAddress.trim();

    if (!to || !ethers.isAddress(to)) {
      Alert.alert(t.common.error, t.errors.invalidAddress);
      return;
    }

    if (!nft && (!amount || parseFloat(amount) <= 0)) {
      Alert.alert(t.common.error, t.errors.invalidAmount);
      return;
    }

    if (!nft && parseFloat(amount) > parseFloat(balance)) {
      Alert.alert(t.common.error, t.errors.insufficientBalance);
      return;
    }

    const symbol = sendToken?.symbol || network.symbol;
    const message = nft
      ? `${t.nft.send}: ${nft.name} (#${nft.tokenId})\n${t.send.to}: ${formatAddress(to)}`
      : `${t.send.to}: ${formatAddress(to)}\n${t.send.amount}: ${amount} ${symbol}\n${t.send.gasFee}: ~0.0001 ${network.symbol}`;

    Alert.alert(
      t.send.confirmTransaction,
      message,
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: t.common.confirm,
          onPress: async () => {
            try {
              setSending(true);
              let txHash = '';

              if (nft) {
                const wallet = await WalletService.getWallet();
                txHash = await NFTService.transferNFT(
                  wallet,
                  nft.contractAddress,
                  nft.tokenId,
                  to,
                  network.chainId
                );
              } else if (sendToken && sendToken.address && sendToken.address !== 'native' && sendToken.address !== ethers.ZeroAddress) {
                txHash = await WalletService.sendToken(
                  sendToken.address,
                  to,
                  String(amount),
                  sendToken.decimals || 18
                );
              } else {
                txHash = await WalletService.sendTransaction(to, String(amount), gasPrice);
              }
               
              Alert.alert(
                t.common.success,
                `${t.transaction.sent}${txHash ? `\n${txHash}` : ''}`,
                [
                  {
                    text: t.common.done,
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(t.common.error, error.message || t.errors.transactionFailed);
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

  const selectWallet = (wallet: any) => {
    setRecipientAddress(wallet.address);
    setShowWalletSelector(false);
  };

  const handleScanQRCode = () => {
    navigation.navigate('ScanQRCode', { sourceRouteKey: route.key });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{`< ${t.common.back}`}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{nft ? t.nft.sendNFT : `${t.send.send} ${sendToken?.symbol || network.symbol}`}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Asset Card */}
        {nft ? (
          <View style={styles.nftCard}>
             <Image source={{uri: nft.image}} style={styles.nftThumb} />
             <View style={styles.nftInfo}>
                <Text style={styles.nftName}>{nft.name}</Text>
                <Text style={styles.nftId}>#{nft.tokenId}</Text>
                <Text style={styles.nftStandard}>{nft.type || 'ERC721'}</Text>
             </View>
          </View>
        ) : (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t.send.available}</Text>
            <Text style={styles.balanceAmount}>
              {parseFloat(balance).toFixed(6)} {sendToken?.symbol || network.symbol}
            </Text>
            <Text style={styles.balanceNetwork}>{network.name}</Text>
          </View>
        )}

        {/* Recipient Address */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t.send.recipientAddress}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.scanButton} onPress={handleScanQRCode}>
            <Text style={styles.scanButtonText}>{t.send.scanQRCode}</Text>
          </TouchableOpacity>

          {/* My Wallets Selector (Below Input) */}
          <View style={styles.myWalletSection}>
            <TouchableOpacity onPress={() => setShowWalletSelector(!showWalletSelector)} style={styles.myWalletTrigger}>
              <Text style={styles.myWalletLink}>
                {showWalletSelector ? t.common.cancel : `${t.common.select} ${t.send.myWallets}`}
              </Text>
            </TouchableOpacity>

            {showWalletSelector && (
              <View style={styles.walletDropdown}>
                {myWallets.map((wallet) => (
                  <TouchableOpacity 
                    key={wallet.address} 
                    style={styles.dropdownItem} 
                    onPress={() => selectWallet(wallet)}
                  >
                    <View style={styles.dropdownIcon} />
                    <View>
                        <Text style={styles.dropdownName}>{wallet.name}</Text>
                        <Text style={styles.dropdownAddress}>{formatAddress(wallet.address)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Amount (Only for Tokens) */}
        {!nft && (
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t.send.amount}</Text>
              <TouchableOpacity onPress={setMaxAmount}>
                <Text style={styles.maxButton}>{t.send.max}</Text>
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
              <Text style={styles.amountSymbol}>{sendToken?.symbol || network.symbol}</Text>
            </View>
          </View>
        )}

        {/* Gas Price */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>{t.send.gasPrice} (Gwei)</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={gasPrice}
            onChangeText={setGasPrice}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>{`${t.send.fast} / ${t.send.normal} / ${t.send.slow}`}</Text>
        </View>

        {/* Transaction Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t.send.transactionDetails}</Text>

          {!nft && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t.send.amount}</Text>
              <Text style={styles.summaryValue}>{amount || '0'} {sendToken?.symbol || network.symbol}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.send.gasFee} (est.)</Text>
            <Text style={styles.summaryValue}>~0.0001 {network.symbol}</Text>
          </View>

          {!nft && (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabelBold}>{t.send.total}</Text>
              <Text style={styles.summaryValueBold}>
                {(parseFloat(amount || '0') + 0.0001).toFixed(6)} {sendToken?.symbol || network.symbol}
              </Text>
            </View>
          )}
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
            <Text style={styles.sendButtonText}>{t.send.send}</Text>
          )}
        </TouchableOpacity>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {t.receive.warningMessage}
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
  nftCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  nftThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  nftInfo: {
    flex: 1,
  },
  nftName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  nftId: {
    fontSize: 14,
    color: '#666',
  },
  nftStandard: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
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
  walletDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3BA2F',
    marginRight: 12,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  dropdownAddress: {
    fontSize: 12,
    color: '#666',
  },
  myWalletSection: {
    marginTop: 8,
  },
  myWalletTrigger: {
    paddingVertical: 8,
  },
  myWalletLink: {
    color: '#F3BA2F',
    fontSize: 14,
    fontWeight: '600',
  },
});
