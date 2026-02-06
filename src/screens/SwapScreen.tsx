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
} from 'react-native';
import WalletService from '../services/WalletService';
import SwapService from '../services/SwapService';
import { useLanguage } from '../i18n/LanguageContext';

export default function SwapScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [showRoutesModal, setShowRoutesModal] = useState(false);

  useEffect(() => {
    loadDefaultTokens();
  }, []);

  const loadDefaultTokens = async () => {
    const network = WalletService.getCurrentNetwork();
    // In a real app, fetch tokens from TokenService
    setFromToken({
      symbol: network.symbol,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      logo: 'bnb.png'
    });
    
    setToToken({
      symbol: 'USDT',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      logo: 'usdt.png'
    });
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
  };

  const handleGetQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setLoading(true);
      // Simulate getting quote
      const routes = await SwapService.getRoutes(
        fromToken,
        toToken,
        amount,
        slippage
      );
      
      setAllRoutes(routes);
      setQuote(routes[0]); // Best route
    } catch (error) {
      Alert.alert(t.common.error, t.swap.insufficientLiquidity);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    try {
      setSwapping(true);
      // Simulate swap
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      Alert.alert(t.common.error, t.swap.swapFailed);
    } finally {
      setSwapping(false);
    }
  };

  const handleViewAllRoutes = () => {
    setShowRoutesModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isTabScreen ? (
          <View style={{ width: 60 }} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← {t.common.back}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t.swap.swap}</Text>
        <TouchableOpacity onPress={() => setShowSlippageModal(true)}>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* From Token */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.swap.youPay}</Text>
          <View style={styles.tokenCard}>
            <TouchableOpacity 
              style={styles.tokenSelector}
              onPress={() => navigation.navigate('SelectToken', { 
                onSelect: setFromToken 
              })}
            >
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenIcon}>🪙</Text>
                <Text style={styles.tokenSymbol}>{fromToken?.symbol || t.swap.selectToken}</Text>
              </View>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              onBlur={handleGetQuote}
            />
          </View>
        </View>

        {/* Switch Button */}
        <View style={styles.switchContainer}>
          <TouchableOpacity style={styles.switchButton} onPress={handleSwitchTokens}>
            <Text style={styles.switchIcon}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.swap.youReceive}</Text>
          <View style={styles.tokenCard}>
            <TouchableOpacity 
              style={styles.tokenSelector}
              onPress={() => navigation.navigate('SelectToken', { 
                onSelect: setToToken 
              })}
            >
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenIcon}>🪙</Text>
                <Text style={styles.tokenSymbol}>{toToken?.symbol || t.swap.selectToken}</Text>
              </View>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
            
            <Text style={[styles.amountInput, styles.amountInputDisabled]}>
              {quote ? SwapService.formatAmount(quote.amountOut, toToken?.decimals) : '0.0'}
            </Text>
          </View>
        </View>

        {/* Quote Details */}
        {quote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{t.swap.rate}</Text>
              <Text style={styles.quoteValue}>
                1 {fromToken.symbol} ≈ {SwapService.calculateRate(amount, quote.amountOut, fromToken.decimals, toToken.decimals)} {toToken.symbol}
              </Text>
            </View>
            
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{t.swap.priceImpact}</Text>
              <Text style={[styles.quoteValue, parseFloat(quote.priceImpact) > 1 && styles.quoteValueWarning]}>
                {quote.priceImpact}%
              </Text>
            </View>
            
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>{t.swap.minimumReceived}</Text>
              <Text style={styles.quoteValue}>
                {SwapService.formatAmount(quote.minAmountOut, toToken.decimals)} {toToken.symbol}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewRoutesButton}
              onPress={handleViewAllRoutes}
            >
              <Text style={styles.viewRoutesText}>{t.swap.route}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Get Quote Button */}
        {!quote && (
          <TouchableOpacity
            style={[styles.quoteButton, loading && styles.quoteButtonDisabled]}
            onPress={handleGetQuote}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.quoteButtonText}>{t.swap.reviewSwap}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Swap Button */}
        {quote && (
          <TouchableOpacity
            style={[styles.swapButton, swapping && styles.swapButtonDisabled]}
            onPress={handleSwap}
            disabled={swapping}
          >
            {swapping ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.swapButtonText}>{t.swap.confirmSwap}</Text>
            )}
          </TouchableOpacity>
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
                  style={[
                    styles.slippageOption,
                    slippage === value && styles.slippageOptionActive
                  ]}
                  onPress={() => setSlippage(value)}
                >
                  <Text style={[
                    styles.slippageOptionText,
                    slippage === value && styles.slippageOptionTextActive
                  ]}>
                    {value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSlippageModal(false)}
            >
              <Text style={styles.modalButtonText}>{t.common.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Routes Modal */}
      <Modal
        visible={showRoutesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoutesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.swap.route}</Text>

            <ScrollView style={styles.routesList}>
              {allRoutes.map((route, index) => (
                <View key={index} style={styles.routeCard}>
                  <Text style={styles.routeDex}>{route.dexName}</Text>
                  <Text style={styles.routeAmount}>
                    {SwapService.formatAmount(route.amountOut, toToken.decimals)} {toToken.symbol}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowRoutesModal(false)}
            >
              <Text style={styles.modalButtonText}>{t.common.close}</Text>
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
  settingsButton: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  tokenSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  arrow: {
    fontSize: 12,
    color: '#999',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    padding: 0,
  },
  amountInputDisabled: {
    color: '#999',
  },
  switchContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3BA2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchIcon: {
    fontSize: 20,
    color: '#000',
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#666',
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  quoteValueWarning: {
    color: '#E53935',
  },
  viewRoutesButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  viewRoutesText: {
    color: '#F3BA2F',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  quoteButtonDisabled: {
    opacity: 0.6,
  },
  quoteButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  swapButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  swapButtonDisabled: {
    opacity: 0.6,
  },
  swapButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
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
    borderColor: '#F3BA2F',
    backgroundColor: '#FFF9E6',
  },
  slippageOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slippageOptionTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  routesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  routeCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeDex: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  routeAmount: {
    fontSize: 14,
    color: '#666',
  },
});
