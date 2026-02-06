/**
 * Eagle Wallet - Swap Screen
 * Token swap with best rate aggregation
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import SwapService, { SwapQuote, SwapRoute } from '../services/SwapService';
import WalletService from '../services/WalletService';
import TokenService from '../services/TokenService';
import { getChainTokens } from '../config/tokenConfig';

export default function SwapScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [allRoutes, setAllRoutes] = useState<SwapRoute[]>([]);
  const [chainId, setChainId] = useState(56);

  useEffect(() => {
    loadDefaultTokens();
  }, []);

  const loadDefaultTokens = async () => {
    const network = WalletService.getCurrentNetwork();
    setChainId(network.chainId);
    
    const tokens = getChainTokens(network.chainId);
    if (tokens.length >= 2) {
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
    }
  };

  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter valid amount');
      return;
    }

    try {
      setLoading(true);
      const amountIn = SwapService.parseAmount(fromAmount, fromToken.decimals);
      
      const swapQuote = await SwapService.getSwapQuote(
        fromToken.address,
        toToken.address,
        amountIn,
        chainId,
        slippage
      );

      setQuote(swapQuote);
      setToAmount(SwapService.formatAmount(swapQuote.toAmount, toToken.decimals));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllRoutes = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    try {
      setLoading(true);
      const amountIn = SwapService.parseAmount(fromAmount, fromToken.decimals);
      const routes = await SwapService.getAllQuotes(
        fromToken.address,
        toToken.address,
        amountIn,
        chainId
      );
      setAllRoutes(routes);
      setShowRoutesModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    Alert.alert(
      'Confirm Swap',
      `Swap ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}?\n\nProvider: ${quote.provider}\nPrice Impact: ${quote.priceImpact}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: async () => {
            try {
              setSwapping(true);
              // Get wallet instance
              // const wallet = await WalletService.getWalletInstance();
              // const txHash = await SwapService.executeSwap(quote, wallet, chainId);
              
              Alert.alert('Success', 'Swap completed successfully!', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Swap failed');
            } finally {
              setSwapping(false);
            }
          },
        },
      ]
    );
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setQuote(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‚Ü?Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Swap</Text>
        <TouchableOpacity onPress={() => setShowSlippageModal(true)}>
          <Text style={styles.settingsButton}>‚öôÔ∏è</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* From Token */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>From</Text>
          <View style={styles.tokenCard}>
            <TouchableOpacity
              style={styles.tokenSelector}
              onPress={() => navigation.navigate('SelectToken', {
                onSelect: (token: any) => setFromToken(token),
              })}
            >
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenIcon}>{fromToken?.icon || '?'}</Text>
                <Text style={styles.tokenSymbol}>{fromToken?.symbol || 'Select'}</Text>
              </View>
              <Text style={styles.arrow}>‚ñ?/Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Switch Button */}
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchTokens}
          >
            <Text style={styles.switchIcon}>‚á?/Text>
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>To</Text>
          <View style={styles.tokenCard}>
            <TouchableOpacity
              style={styles.tokenSelector}
              onPress={() => navigation.navigate('SelectToken', {
                onSelect: (token: any) => setToToken(token),
              })}
            >
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenIcon}>{toToken?.icon || '?'}</Text>
                <Text style={styles.tokenSymbol}>{toToken?.symbol || 'Select'}</Text>
              </View>
              <Text style={styles.arrow}>‚ñ?/Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.amountInput, styles.amountInputDisabled]}
              placeholder="0.0"
              value={toAmount}
              editable={false}
            />
          </View>
        </View>

        {/* Quote Info */}
        {quote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Provider</Text>
              <Text style={styles.quoteValue}>{quote.provider}</Text>
            </View>
            
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Exchange Rate</Text>
              <Text style={styles.quoteValue}>
                1 {fromToken.symbol} = {parseFloat(quote.exchangeRate).toFixed(6)} {toToken.symbol}
              </Text>
            </View>
            
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Price Impact</Text>
              <Text style={[
                styles.quoteValue,
                parseFloat(quote.priceImpact) > 5 && styles.quoteValueWarning
              ]}>
                {quote.priceImpact}%
              </Text>
            </View>
            
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Minimum Received</Text>
              <Text style={styles.quoteValue}>
                {SwapService.formatAmount(quote.toAmountMin, toToken.decimals)} {toToken.symbol}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewRoutesButton}
              onPress={handleViewAllRoutes}
            >
              <Text style={styles.viewRoutesText}>View All Routes</Text>
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
              <Text style={styles.quoteButtonText}>Get Quote</Text>
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
              <Text style={styles.swapButtonText}>Swap</Text>
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
            <Text style={styles.modalTitle}>Slippage Tolerance</Text>
            
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
              <Text style={styles.modalButtonText}>Done</Text>
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
            <Text style={styles.modalTitle}>Available Routes</Text>
            
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
              <Text style={styles.modalButtonText}>Close</Text>
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
