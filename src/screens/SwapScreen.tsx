/**
 * Eagle Wallet - Swap Screen
 * Cross-chain swap interface
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
  Modal,
  Image,
} from 'react-native';
import WalletService from '../services/WalletService';
import SwapService from '../services/SwapService';
import TokenLogoService from '../services/TokenLogoService';
import { useLanguage } from '../i18n/LanguageContext';
import { ethers } from 'ethers';

export default function SwapScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // Default 0.5% (displayed as 1% in screenshot?) let's keep 0.5 or 1
  const [showSlippageModal, setShowSlippageModal] = useState(false);

  // Balances
  const [fromBalance, setFromBalance] = useState('0.0');
  const [toBalance, setToBalance] = useState('0.0');

  useEffect(() => {
    loadDefaultTokens();
  }, []);

  const loadDefaultTokens = async () => {
    const network = WalletService.getCurrentNetwork();
    const walletAddress = await WalletService.getAddress();

    // Default From: Native Token (e.g. BNB)
    const nativeToken = {
      symbol: network.symbol,
      name: network.name,
      address: ethers.ZeroAddress,
      decimals: 18,
      logo: network.symbol.toLowerCase()
    };
    setFromToken(nativeToken);

    // Default To: USDT
    setFromToken(nativeToken);
    setToToken({
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      logo: 'usdt'
    });

    // Load Balance for Native
    if (walletAddress) {
      const bal = await WalletService.getBalance();
      setFromBalance(bal);
    }
  };

  const handleSwitchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);

    const tempBal = fromBalance;
    setFromBalance(toBalance);
    setToBalance(tempBal);

    setQuote(null);
  };

  const handleGetQuote = async () => {
    if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
      setQuote(null);
      return;
    }

    try {
      setLoading(true);
      setQuote(null);

      const result = await SwapService.getBestQuote(
        fromToken.address,
        toToken.address,
        amount,
        fromToken.decimals,
        toToken.decimals
      );

      if (result) {
        setQuote(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    try {
      setSwapping(true);

      const wallet = await WalletService.getWallet();
      const network = WalletService.getCurrentNetwork();

      const swapQuote = {
        fromToken: fromToken.address,
        toToken: toToken.address,
        fromAmount: SwapService.parseAmount(amount, fromToken.decimals),
        toAmount: SwapService.parseAmount(quote.amountOut, toToken.decimals),
        toAmountMin: SwapService.parseAmount(
          (parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(toToken.decimals),
          toToken.decimals
        ),
        provider: 'EagleSwap',
        dexId: 0,
        path: quote.path,
        priceImpact: quote.priceImpact,
        gasEstimate: '250000',
        exchangeRate: (parseFloat(quote.amountOut) / parseFloat(amount)).toString(),
        quoteType: quote.quoteType,
        fees: quote.fees
      };

      const txHash = await SwapService.executeSwap(swapQuote, wallet, network.chainId);

      Alert.alert(t.common.success, t.swap.swapSuccess, [
        {
          text: t.common.done,
          onPress: () => {
            setAmount('');
            setQuote(null);
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(t.common.error, t.swap.swapFailed);
    } finally {
      setSwapping(false);
    }
  };

  const renderTokenIcon = (token: any) => {
    if (!token) return <Text style={styles.tokenIcon}>🪙</Text>;
    if (token.logo && token.logo.startsWith('http')) {
      return <Image source={{ uri: token.logo }} style={styles.tokenLogoImage} />;
    }
    const logoSource = TokenLogoService.getTokenLogo(token.logo || token.symbol);
    if (logoSource) {
      return <Image source={logoSource} style={styles.tokenLogoImage} />;
    }
    return (
      <View style={[styles.tokenIconFallback, { backgroundColor: token.color || '#F3BA2F' }]}>
        <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
      </View>
    );
  };

  // Helper to check balance
  const hasInsufficientBalance = () => {
    if (!amount || !fromBalance) return false;
    return parseFloat(amount) > parseFloat(fromBalance);
  };

  const getButtonLabel = () => {
    if (!amount) return t.swap.enterAmount || 'Enter Amount';
    if (hasInsufficientBalance()) return t.swap.insufficientBalance || 'Insufficient Balance'; // 余额不足
    if (loading) return 'Getting Quote...';
    if (!quote) return t.swap.reviewSwap; // Or 'Review Swap'
    return t.swap.confirmSwap || 'Swap'; // 兑换
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isTabScreen ? <View style={{ width: 40 }} /> : (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← {t.common.back}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t.swap.swap}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.headerIcon}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.headerIcon}>🕒</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSlippageModal(true)} style={styles.iconButton}>
            <Text style={[styles.headerIcon, styles.slippageText]}>{slippage}% ⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* From Token Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>{t.swap.youPay || 'Pay'}</Text>
            <Text style={styles.balanceText}>
              Wallet: {parseFloat(fromBalance).toFixed(4)}
            </Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.tokenSelector}
              onPress={() => navigation.navigate('SelectToken', { onSelect: setFromToken })}
            >
              {renderTokenIcon(fromToken)}
              <Text style={styles.tokenSymbol}>{fromToken?.symbol || 'Select'}</Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              onBlur={handleGetQuote}
            />
          </View>
          <Text style={styles.usdValue}>≈ ${amount ? (parseFloat(amount) * 644.90).toFixed(2) : '0.00'}</Text>
        </View>

        {/* Switch Button */}
        <View style={styles.switchContainer}>
          <TouchableOpacity style={styles.switchButton} onPress={handleSwitchTokens}>
            <Text style={styles.switchIcon}>↓↑</Text>
          </TouchableOpacity>
        </View>

        {/* To Token Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>{t.swap.youReceive || 'Receive'}</Text>
            <Text style={styles.balanceText}>
              Wallet: {parseFloat(toBalance).toFixed(4)}
            </Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.tokenSelector}
              onPress={() => navigation.navigate('SelectToken', { onSelect: setToToken })}
            >
              {renderTokenIcon(toToken)}
              <Text style={styles.tokenSymbol}>{toToken?.symbol || 'Select'}</Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
            <Text style={[styles.amountInput, styles.readOnlyInput]}>
              {quote ? parseFloat(quote.amountOut).toFixed(6) : '0'}
            </Text>
          </View>
          <Text style={styles.usdValue}>≈ ${quote ? (parseFloat(quote.amountOut) * 1.00).toFixed(2) : '0.00'}</Text>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapButton,
            hasInsufficientBalance() ? styles.swapButtonError : null,
            loading && styles.swapButtonDisabled
          ]}
          onPress={quote ? handleSwap : handleGetQuote}
          disabled={loading || (!quote && !amount) || (hasInsufficientBalance())}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.swapButtonText}>{getButtonLabel()}</Text>
          )}
        </TouchableOpacity>

        {/* Quote Details (Matches Screenshot) */}
        {quote && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>预计接收数量</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValueGreen}>{parseFloat(quote.amountOut).toFixed(6)} {toToken?.symbol}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>最小接收数量</Text>
              <Text style={styles.detailValue}>
                {(parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(6)} {toToken?.symbol}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>滑点容忍度</Text>
              <Text style={styles.detailValue}>{slippage}% ⚙️</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>参考价格</Text>
              <Text style={styles.detailValueGreen}>
                ${(parseFloat(quote.amountOut) / parseFloat(amount)).toFixed(6)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>手续费</Text>
              <Text style={styles.detailValue}>{quote.fees ? (quote.fees / 10000).toFixed(2) : '0.25'}%</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>兑换路径</Text>
              <View style={styles.routeContainer}>
                <Text style={styles.routeText}>Eagle Swap</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Slippage Modal */}
      <Modal
        visible={showSlippageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSlippageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.swap.slippageTolerance}</Text>
            <View style={styles.slippageOptions}>
              {[0.1, 0.5, 1.0].map(value => (
                <TouchableOpacity
                  key={value}
                  style={[styles.slippageOption, slippage === value && styles.slippageOptionActive]}
                  onPress={() => setSlippage(value)}
                >
                  <Text style={[styles.slippageOptionText, slippage === value && styles.slippageOptionTextActive]}>
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSlippageModal(false)}>
              <Text style={styles.modalButtonText}>{t.common.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA', // Light gray bg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    fontSize: 16,
    color: '#E5B047',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
  headerIcon: {
    fontSize: 18,
    color: '#666',
  },
  slippageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#26A17B', // Greenish or consistent color
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 12,
    color: '#999',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 24,
    paddingRight: 12,
  },
  tokenLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  tokenIconFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3BA2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tokenIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tokenIconText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginRight: 4,
  },
  arrow: {
    fontSize: 12,
    color: '#999',
  },
  amountInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
    flex: 1,
    padding: 0,
  },
  readOnlyInput: {
    color: '#333',
  },
  usdValue: {
    textAlign: 'right',
    fontSize: 14,
    color: '#999',
  },
  switchContainer: {
    alignItems: 'center',
    height: 20,
    zIndex: 10,
    marginTop: -18,
    marginBottom: -2,
  },
  switchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  switchIcon: {
    fontSize: 16,
    color: '#666',
  },
  swapButton: {
    backgroundColor: '#6C8FF7', // Blue color from screenshot
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  swapButtonError: {
    backgroundColor: '#FF6B6B', // Red for insufficient balance
  },
  swapButtonDisabled: {
    opacity: 0.7,
  },
  swapButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 30, // Extra padding at bottom
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  detailValueGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#26A17B',
  },
  detailValueContainer: {
    backgroundColor: '#26A17B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailValueGreenBg: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    color: '#6C8FF7',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  slippageOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  slippageOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  slippageOptionActive: {
    borderColor: '#6C8FF7',
    backgroundColor: '#F0F4FF',
  },
  slippageOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slippageOptionTextActive: {
    color: '#6C8FF7',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#6C8FF7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
