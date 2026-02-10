/**
 * Eagle Wallet - Swap Screen
 * Cross-chain swap interface
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import PriceService from '../services/PriceService';
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
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [gasFee, setGasFee] = useState<{native: string, usd: string} | null>(null);
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approving, setApproving] = useState(false);

  // Balances & Prices
  const [fromBalance, setFromBalance] = useState('0.0');
  const [toBalance, setToBalance] = useState('0.0');
  const [prices, setPrices] = useState<{from: number, to: number}>({ from: 0, to: 0 });

  // Debounce and Interval refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    loadDefaultTokens();
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  // Update prices when tokens change
  useEffect(() => {
    fetchPrices();
  }, [fromToken, toToken]);

  // Auto-refresh quote every 5 seconds if valid
  useEffect(() => {
    if (refreshInterval.current) clearInterval(refreshInterval.current);

    if (quote && amount && parseFloat(amount) > 0) {
      refreshInterval.current = setInterval(() => {
        handleGetQuote(true); // silent refresh
      }, 5000);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [amount, fromToken, toToken]);

  // Check allowance when token or amount changes
  useEffect(() => {
      checkAllowance();
  }, [fromToken, amount]);

  const checkAllowance = async () => {
      if (!fromToken || !amount || parseFloat(amount) <= 0 || fromToken.address === ethers.ZeroAddress) {
          if (isMounted.current) setNeedsApproval(false);
          return;
      }
      
      try {
          const network = WalletService.getCurrentNetwork();
          const walletAddress = await WalletService.getAddress();
          const spender = SwapService.getSpenderAddress(network.chainId);
          
          if (!walletAddress || !spender) return;

          const allowance = await SwapService.checkAllowance(fromToken.address, walletAddress, spender);
          const amountInWei = SwapService.parseAmount(amount, fromToken.decimals);
          
          if (isMounted.current) {
              setNeedsApproval(allowance < BigInt(amountInWei));
          }
      } catch (e) {
          console.error("Check allowance failed", e);
      }
  };

  const handleApprove = async () => {
      if (!fromToken || !amount) return;
      
      try {
          setApproving(true);
          const wallet = await WalletService.getWallet();
          const network = WalletService.getCurrentNetwork();
          const spender = SwapService.getSpenderAddress(network.chainId);
          const amountInWei = SwapService.parseAmount(amount, fromToken.decimals);
          
          await SwapService.approveToken(fromToken.address, spender, amountInWei, wallet);
          
          Alert.alert(t.common.success, "Token Approved");
          setNeedsApproval(false);
      } catch (e) {
          console.error("Approve failed", e);
          Alert.alert(t.common.error, "Approval failed");
      } finally {
          setApproving(false);
      }
  };

  const fetchPrices = async () => {
    if (!fromToken || !toToken) return;

    const network = WalletService.getCurrentNetwork();
    const fromAddr = fromToken.address === ethers.ZeroAddress ? 'native' : fromToken.address;
    const toAddr = toToken.address === ethers.ZeroAddress ? 'native' : toToken.address;

    try {
      const fetchedPrices = await PriceService.getMultipleTokenPrices([fromAddr, toAddr], network.chainId);

      if (isMounted.current) {
        setPrices({
          from: fetchedPrices[fromAddr.toLowerCase()] || fetchedPrices['native'] || 0,
          to: fetchedPrices[toAddr.toLowerCase()] || fetchedPrices['native'] || 0
        });
      }
    } catch (e) {
      console.error("Failed to fetch prices", e);
    }
  };

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
    setToToken({
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      logo: 'usdt'
    });

    // Load Balance for Native
    if (walletAddress) {
      try {
        const bal = await WalletService.getBalance();
        if (isMounted.current) setFromBalance(bal);
      } catch (e) {
        console.error('Failed to load balance', e);
      }
    }
  };

  const handleSwitchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);

    const tempBal = fromBalance;
    setFromBalance(toBalance);
    setToBalance(tempBal);

    // Swap prices
    setPrices(prev => ({ from: prev.to, to: prev.from }));

    setQuote(null);
  };

  const handleGetQuote = async (isSilent = false) => {
    if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
      if (isMounted.current) setQuote(null);
      return;
    }

    try {
      if (!isSilent && isMounted.current) setLoading(true);

      const result = await SwapService.getBestQuote(
        fromToken.address,
        toToken.address,
        amount,
        fromToken.decimals,
        toToken.decimals
      );

      if (isMounted.current) {
        if (result) {
          setQuote(result);
        } else {
          // Only clear quote if explicit failure on non-silent update, 
          // or maybe keep old quote to avoid flickering? 
          // Better to keep old quote if refresh fails.
          if (!isSilent) setQuote(null);
        }
      }
    } catch (error) {
      console.error(error);
      // Don't clear quote on silent refresh failure
      if (!isSilent && isMounted.current) setQuote(null);
    } finally {
      if (!isSilent && isMounted.current) setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;
    
    // Estimate Gas Fee before confirmation
    try {
        const provider = await WalletService.getProvider();
        const feeData = await provider.getFeeData();
        const gasLimit = BigInt(quote.gasEstimate || 250000);
        const gasPrice = feeData.gasPrice || BigInt(3000000000); // Default 3 gwei if null
        const estimatedFee = gasLimit * gasPrice;
        const feeNative = ethers.formatEther(estimatedFee);
        
        // Get native price for USD calculation
        const nativePrice = prices.from || 0; // Approximate if from is native, else need separate fetch. 
        // Better to fetch native price directly or use existing if 'from' is native.
        // If fromToken is not native, prices.from is token price.
        // Let's rely on PriceService cache or just fetch native price quickly.
        const network = WalletService.getCurrentNetwork();
        const nativePriceVal = await PriceService.getTokenPriceBySymbol(network.symbol, network.chainId);
        const feeUsd = (parseFloat(feeNative) * nativePriceVal).toFixed(2);

        setGasFee({ native: parseFloat(feeNative).toFixed(5), usd: feeUsd });
        setShowConfirmModal(true);
    } catch (e) {
        console.error("Gas estimation failed", e);
        setGasFee({ native: "0.0005", usd: "0.15" }); // Fallback
        setShowConfirmModal(true);
    }
  };

  const executeSwapTransaction = async () => {
    try {
      setSwapping(true);
      setShowConfirmModal(false);
      
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
    if (hasInsufficientBalance()) return t.errors.insufficientBalance || 'Insufficient Balance';
    if (loading && !quote) return 'Getting Quote...';
    if (needsApproval) return approving ? (t.swap.approving || 'Approving...') : `${t.swap.approve || 'Approve'} ${fromToken?.symbol}`;
    if (!quote) return t.swap.reviewSwap; 
    return t.swap.confirmSwap || 'Swap'; 
  };

  const getDexName = (quoteType: string) => {
    if (quoteType === 'V3') return 'PancakeSwap V3';
    return 'PancakeSwap V2';
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
          <TouchableOpacity style={styles.iconButton} onPress={() => handleGetQuote()}>
            <Text style={styles.headerIcon}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSwitchTokens}>
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
              {t.swap.wallet || 'Wallet'}: {parseFloat(fromBalance).toFixed(4)}
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
            />
          </View>
          <Text style={styles.usdValue}>≈ ${amount ? (parseFloat(amount) * prices.from).toFixed(2) : '0.00'}</Text>
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
              {t.swap.wallet || 'Wallet'}: {parseFloat(toBalance).toFixed(4)}
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
          <Text style={styles.usdValue}>≈ ${quote ? (parseFloat(quote.amountOut) * prices.to).toFixed(2) : '0.00'}</Text>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapButton, 
            hasInsufficientBalance() ? styles.swapButtonError : null,
            ((loading && !quote) || approving) && styles.swapButtonDisabled
          ]}
          onPress={needsApproval ? handleApprove : (quote ? handleSwap : () => handleGetQuote())}
          disabled={(loading && !quote) || (!quote && !amount) || (hasInsufficientBalance()) || approving}
        >
          {approving ? (
            <ActivityIndicator color="#FFF" />
          ) : (loading && !quote) ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.swapButtonText}>{getButtonLabel()}</Text>
          )}
        </TouchableOpacity>

        {/* Quote Details (Matches Screenshot) */}
        {quote && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.estimatedReceived}</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValueGreenBg}>{parseFloat(quote.amountOut).toFixed(6)} {toToken?.symbol}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.minimumReceived}</Text>
              <Text style={styles.detailValue}>
                {(parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(6)} {toToken?.symbol}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.slippageTolerance}</Text>
              <Text style={styles.detailValue}>{slippage}% ⚙️</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.priceReference}</Text>
              <Text style={styles.detailValueGreen}>
                1 {fromToken?.symbol} ≈ {(parseFloat(quote.amountOut) / parseFloat(amount)).toFixed(6)} {toToken?.symbol} ↻
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{toToken?.symbol} {t.swap.price} ⓘ</Text>
              <Text style={styles.detailValueGreen}>${prices.to > 0 ? prices.to.toFixed(2) : '-'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.fee} ⓘ</Text>
              <Text style={styles.detailValue}>{quote.fees ? (quote.fees / 10000).toFixed(2) : '0.25'}%</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.route}</Text>
              <Text style={styles.detailValueBlue}>{getDexName(quote.quoteType)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.pool}</Text>
              <Text style={styles.detailValue}>{quote.path.length > 2 ? 'Multi-Hop' : 'DIRECT'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t.swap.swapRoute}</Text>
              <View style={styles.routeContainer}>
                {/* Would be nice to have logo here */}
                <Text style={styles.routeTextBlue}>Eagle Swap</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmHeader}>
                <Text style={styles.confirmTitle}>{t.swap.reviewSwap || 'Review Swap'}</Text>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.confirmSection}>
                <View style={styles.confirmTokenRow}>
                    <View style={styles.tokenInfo}>
                        {renderTokenIcon(fromToken)}
                        <View style={{marginLeft: 8}}>
                            <Text style={styles.confirmAmount}>{amount}</Text>
                            <Text style={styles.confirmSymbol}>{fromToken?.symbol}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.confirmArrowContainer}>
                    <Text style={styles.confirmArrow}>↓</Text>
                </View>

                <View style={styles.confirmTokenRow}>
                    <View style={styles.tokenInfo}>
                        {renderTokenIcon(toToken)}
                        <View style={{marginLeft: 8}}>
                            <Text style={styles.confirmAmount}>{quote ? parseFloat(quote.amountOut).toFixed(6) : '0'}</Text>
                            <Text style={styles.confirmSymbol}>{toToken?.symbol}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.confirmDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Provider</Text>
                    <Text style={styles.detailValue}>Eagle Swap</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.swap.rate}</Text>
                    <Text style={styles.detailValue}>
                        1 {fromToken?.symbol} ≈ {quote ? (parseFloat(quote.amountOut) / parseFloat(amount)).toFixed(6) : '0'} {toToken?.symbol}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.swap.priceImpact}</Text>
                    <Text style={styles.detailValueGreen}>{quote?.priceImpact}%</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t.swap.minimumReceived}</Text>
                    <Text style={styles.detailValue}>
                        {quote ? (parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(6) : '0'} {toToken?.symbol}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Network Cost</Text>
                    <View style={{alignItems: 'flex-end'}}>
                        <Text style={styles.detailValue}>~${gasFee?.usd || '0.00'}</Text>
                        <Text style={styles.detailSubValue}>({gasFee?.native || '0'} {WalletService.getCurrentNetwork().symbol})</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.confirmButton, swapping && styles.swapButtonDisabled]}
                onPress={executeSwapTransaction}
                disabled={swapping}
            >
                {swapping ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.confirmButtonText}>{t.swap.confirmSwap || 'Confirm Swap'}</Text>
                )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  detailValueBlue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
  routeTextBlue: {
    color: '#3B82F6', // Blue color for Eagle Swap link
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
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  confirmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  confirmSymbol: {
    fontSize: 14,
    color: '#666',
  },
  confirmArrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  confirmArrow: {
    fontSize: 24,
    color: '#F3BA2F',
  },
  confirmDetails: {
    backgroundColor: '#F7F8FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailSubValue: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#F3BA2F',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
