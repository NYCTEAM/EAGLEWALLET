/**
 * Eagle Wallet - Swap Screen
 * Quote, approve, simulate, and swap flow.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ethers } from 'ethers';
import { useLanguage } from '../i18n/LanguageContext';
import PriceService from '../services/PriceService';
import SwapService, { SwapSimulationResult } from '../services/SwapService';
import WalletService from '../services/WalletService';
import TokenLogoService from '../services/TokenLogoService';
import SwapMiningService from '../services/SwapMiningService';
import RewardsDappService from '../services/RewardsDappService';

export default function SwapScreen({ navigation, isTabScreen }: any) {
  const { t } = useLanguage();

  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [approving, setApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SwapSimulationResult | null>(null);
  const [gasFee, setGasFee] = useState<{ native: string; usd: string } | null>(null);

  const [fromBalance, setFromBalance] = useState('0');
  const [toBalance, setToBalance] = useState('0');
  const [prices, setPrices] = useState<{ from: number; to: number }>({ from: 0, to: 0 });

  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    void loadDefaultTokens();

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  useEffect(() => {
    void fetchPrices();
  }, [fromToken, toToken]);

  useEffect(() => {
    void checkAllowance();
  }, [fromToken, amount]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSimulationResult(null);

    if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
      setQuote(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      void getQuote({ silent: true, showIndicator: true });
    }, 450);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [amount, fromToken, toToken]);

  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (!quote || !amount) return;

    refreshTimer.current = setInterval(() => {
      void getQuote({ silent: true, showIndicator: false });
    }, 5000);
  }, [quote, amount, fromToken, toToken]);

  const loadDefaultTokens = async () => {
    const network = WalletService.getCurrentNetwork();
    const address = await WalletService.getAddress();
    if (!address) return;

    setFromToken({
      symbol: network.symbol,
      name: network.name,
      address: ethers.ZeroAddress,
      decimals: 18,
      logo: network.symbol.toLowerCase(),
    });
    setToToken({
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      logo: 'usdt',
    });

    const bal = await WalletService.getBalance();
    if (isMounted.current) setFromBalance(bal);
  };

  const fetchPrices = async () => {
    if (!fromToken || !toToken) return;
    try {
      const network = WalletService.getCurrentNetwork();
      const fromAddr = fromToken.address === ethers.ZeroAddress ? 'native' : fromToken.address;
      const toAddr = toToken.address === ethers.ZeroAddress ? 'native' : toToken.address;
      const fetched = await PriceService.getMultipleTokenPrices([fromAddr, toAddr], network.chainId);
      if (!isMounted.current) return;

      setPrices({
        from: fetched[fromAddr.toLowerCase()] || fetched.native || 0,
        to: fetched[toAddr.toLowerCase()] || fetched.native || 0,
      });
    } catch (error) {
      console.error('fetchPrices', error);
    }
  };

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
      if (isMounted.current) setNeedsApproval(allowance < BigInt(amountInWei));
    } catch (error) {
      console.error('checkAllowance', error);
    }
  };

  const approveToken = async () => {
    if (!fromToken || !amount) return;
    try {
      setApproving(true);
      const wallet = await WalletService.getWallet();
      const network = WalletService.getCurrentNetwork();
      const spender = SwapService.getSpenderAddress(network.chainId);
      const amountInWei = SwapService.parseAmount(amount, fromToken.decimals);
      await SwapService.approveToken(fromToken.address, spender, amountInWei, wallet);
      setNeedsApproval(false);
      Alert.alert(t.common.success, `${t.swap.approve} ${fromToken.symbol}`);
    } catch (error) {
      console.error('approveToken', error);
      Alert.alert(t.common.error, t.transaction.failed);
    } finally {
      setApproving(false);
    }
  };

  const getQuote = async (options: { silent?: boolean; showIndicator?: boolean } = {}) => {
    const silent = options.silent ?? false;
    const showIndicator = options.showIndicator ?? true;
    if (!amount || !fromToken || !toToken || parseFloat(amount) <= 0) {
      setQuote(null);
      if (showIndicator) setQuoting(false);
      return;
    }
    try {
      if (showIndicator) setQuoting(true);
      if (!silent) setLoading(true);
      const network = WalletService.getCurrentNetwork();
      const result = await SwapService.getBestQuote(
        fromToken.address,
        toToken.address,
        amount,
        fromToken.decimals,
        toToken.decimals,
        network.chainId,
      );
      if (isMounted.current) setQuote(result || null);
    } catch (error) {
      if (!silent) setQuote(null);
      console.error('getQuote', error);
    } finally {
      if (showIndicator) setQuoting(false);
      if (!silent) setLoading(false);
    }
  };

  const buildSwapQuote = () => {
    if (!quote || !fromToken || !toToken || !amount) return null;
    return {
      fromToken: fromToken.address,
      toToken: toToken.address,
      fromAmount: SwapService.parseAmount(amount, fromToken.decimals),
      toAmount: SwapService.parseAmount(quote.amountOut, toToken.decimals),
      toAmountMin: SwapService.parseAmount(
        (parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(toToken.decimals),
        toToken.decimals,
      ),
      provider: 'EagleSwap',
      dexId: 0,
      path: quote.path,
      priceImpact: quote.priceImpact,
      gasEstimate: '250000',
      exchangeRate: (parseFloat(quote.amountOut) / parseFloat(amount)).toString(),
      quoteType: quote.quoteType,
      fees: quote.fees,
    };
  };

  const openConfirm = async () => {
    const swapQuote = buildSwapQuote();
    if (!swapQuote) return;
    try {
      setSimulating(true);
      const wallet = await WalletService.getWallet();
      const network = WalletService.getCurrentNetwork();
      const sim = await SwapService.simulateSwap(swapQuote, wallet, network.chainId);
      setSimulationResult(sim);

      const provider = await WalletService.getProvider();
      const feeData = await provider.getFeeData();
      const gasLimit = BigInt(sim.gasEstimate || 250000);
      const gasPrice = feeData.gasPrice || BigInt(3000000000);
      const feeNative = ethers.formatEther(gasLimit * gasPrice);
      const nativePrice = await PriceService.getTokenPriceBySymbol(network.symbol, network.chainId);
      setGasFee({
        native: parseFloat(feeNative).toFixed(5),
        usd: (parseFloat(feeNative) * nativePrice).toFixed(2),
      });

      setShowConfirmModal(true);
    } catch (error) {
      console.error('openConfirm', error);
      setSimulationResult({ ok: false, reason: t.transaction.failed });
      setGasFee({ native: '0.0005', usd: '0.15' });
      setShowConfirmModal(true);
    } finally {
      setSimulating(false);
    }
  };

  const executeSwap = async () => {
    if (simulationResult && !simulationResult.ok) {
      Alert.alert(t.common.error, simulationResult.reason || t.transaction.failed);
      return;
    }

    const swapQuote = buildSwapQuote();
    if (!swapQuote) return;
    try {
      setSwapping(true);
      setShowConfirmModal(false);
      const wallet = await WalletService.getWallet();
      const network = WalletService.getCurrentNetwork();
      const txHash = await SwapService.executeSwap(swapQuote, wallet, network.chainId);

      const openRewards = async () => {
        const url = await RewardsDappService.getRewardsUrl();
        navigation.navigate('DAppWebView', {
          url,
          title: t.transaction.viewRewards,
        });
      };

      // Record swap mining reward (non-blocking)
      const fromSymbol = fromToken?.symbol || 'UNKNOWN';
      const toSymbol = toToken?.symbol || 'UNKNOWN';
      const amountInNum = parseFloat(amount || '0');
      const amountOutNum = parseFloat(quote?.amountOut || '0');
      const tradeValueUsdt =
        prices.from > 0
          ? amountInNum * prices.from
          : prices.to > 0
            ? amountOutNum * prices.to
            : 0;

      const normalizeNativeForApi = (addr: string) =>
        addr === ethers.ZeroAddress ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : addr;

      let rewardAmount: number | null = null;
      try {
        const fromTokenAddress = fromToken?.address || ethers.ZeroAddress;
        const toTokenAddress = toToken?.address || ethers.ZeroAddress;
        const userAddress = (await WalletService.getAddress()) || '';
        if (userAddress) {
          const recordResult = await SwapMiningService.recordSwap({
            txHash,
            userAddress,
            fromToken: normalizeNativeForApi(fromTokenAddress),
            toToken: normalizeNativeForApi(toTokenAddress),
            fromAmount: amountInNum,
            toAmount: amountOutNum,
            tradeValueUsdt: Number.isFinite(tradeValueUsdt) ? tradeValueUsdt : 0,
            chainId: network.chainId,
            routeInfo: `${fromSymbol} → ${toSymbol} via ${getDexName(quote?.quoteType)}`,
            fromTokenSymbol: fromSymbol,
            toTokenSymbol: toSymbol,
            swapType: 'instant',
            fromTokenDecimals: fromToken?.decimals || 18,
            toTokenDecimals: toToken?.decimals || 18,
            dexName: getDexName(quote?.quoteType),
          });

          const rawReward =
            recordResult?.data?.eagleReward ??
            recordResult?.eagleReward ??
            0;
          const parsedReward = Number(rawReward);
          rewardAmount = Number.isFinite(parsedReward) ? parsedReward : 0;
        }
      } catch (error) {
        console.warn('Swap mining record error:', error);
      }

      setTimeout(() => {
        if (rewardAmount !== null) {
          const rewardMessage = t.swap.miningReward.replace('{amount}', rewardAmount.toFixed(4));
          Alert.alert(
            t.swap.swapSuccess,
            rewardMessage,
            [
              { text: t.transaction.viewRewards, onPress: openRewards },
              { text: t.common.done, onPress: () => navigation.goBack() },
            ]
          );
        } else {
          Alert.alert(t.common.success, t.swap.swapSuccess, [
            { text: t.common.done, onPress: () => navigation.goBack() },
          ]);
        }
      }, 1000);
    } catch (error) {
      console.error('executeSwap', error);
      Alert.alert(t.common.error, t.swap.swapFailed);
    } finally {
      setSwapping(false);
    }
  };

  const switchTokens = () => {
    const f = fromToken;
    const fb = fromBalance;
    setFromToken(toToken);
    setToToken(f);
    setFromBalance(toBalance);
    setToBalance(fb);
    setQuote(null);
    setSimulationResult(null);
  };

  const setQuickAmount = (percent: number | 'MAX') => {
    const bal = parseFloat(fromBalance || '0');
    if (!Number.isFinite(bal) || bal <= 0) return;

    let v = bal;
    if (percent !== 'MAX') {
      v = (bal * percent) / 100;
    } else if (fromToken?.address === ethers.ZeroAddress) {
      v = Math.max(bal - 0.0005, 0);
    }
    setAmount(v.toFixed(6).replace(/\.?0+$/, ''));
  };

  const buttonLabel = () => {
    if (!amount) return t.swap.enterAmount;
    if (loading && !quote) return t.common.loading;
    if (needsApproval) return approving ? t.swap.approving : `${t.swap.approve} ${fromToken?.symbol}`;
    if (!quote) return t.swap.reviewSwap;
    return t.swap.confirmSwap;
  };

  const getDexName = (quoteType?: string) => {
    if (quoteType === 'V3') return 'PancakeSwap V3';
    return 'PancakeSwap V2';
  };

  const renderTokenPillContent = (token: any) => {
    if (!token) {
      return <Text style={styles.tokenPillText}>{t.common.select}</Text>;
    }

    let logoSource: any = null;
    if (token.logo && typeof token.logo === 'string' && token.logo.startsWith('http')) {
      logoSource = { uri: token.logo };
    } else {
      logoSource = TokenLogoService.getTokenLogo(token.logo || token.symbol);
    }

    return (
      <View style={styles.tokenPillContent}>
        {logoSource ? (
          <Image source={logoSource} style={styles.tokenPillLogo} />
        ) : (
          <View style={styles.tokenPillLogoFallback}>
            <Text style={styles.tokenPillLogoText}>{String(token.symbol || '?')[0]}</Text>
          </View>
        )}
        <Text style={styles.tokenPillText}>{token.symbol}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isTabScreen ? <View style={styles.side} /> : (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{`< ${t.common.back}`}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t.swap.swap}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => void getQuote({ silent: false, showIndicator: true })} style={styles.headerAction}>
            <Text style={styles.headerActionText}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSlippageModal(true)} style={styles.headerAction}>
            <Text style={styles.headerActionText}>{`${slippage}%`}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>{t.swap.youPay}</Text>
          <Text style={styles.balance}>{`${t.swap.wallet}: ${parseFloat(fromBalance).toFixed(4)}`}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.tokenPill} onPress={() => navigation.navigate('SelectToken', { onSelect: setFromToken })}>
              {renderTokenPillContent(fromToken)}
            </TouchableOpacity>
            <TextInput value={amount} onChangeText={setAmount} style={styles.input} keyboardType="decimal-pad" placeholder="0" />
          </View>
          <View style={styles.quickRow}>
            {[25, 50, 75].map((v) => (
              <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setQuickAmount(v)}>
                <Text style={styles.quickBtnText}>{`${v}%`}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.quickBtn, styles.quickBtnMax]} onPress={() => setQuickAmount('MAX')}>
              <Text style={[styles.quickBtnText, styles.quickBtnMaxText]}>{t.swap.max}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.usd}>{`≈ $${amount ? (parseFloat(amount) * prices.from).toFixed(2) : '0.00'}`}</Text>
        </View>

        <TouchableOpacity style={styles.switchBtn} onPress={switchTokens}>
          <Text style={styles.switchBtnText}>⇅</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.label}>{t.swap.youReceive}</Text>
          <Text style={styles.balance}>{`${t.swap.wallet}: ${parseFloat(toBalance).toFixed(4)}`}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.tokenPill} onPress={() => navigation.navigate('SelectToken', { onSelect: setToToken })}>
              {renderTokenPillContent(toToken)}
            </TouchableOpacity>
            <Text style={[styles.input, styles.readonly]}>{quote ? parseFloat(quote.amountOut).toFixed(6) : '0'}</Text>
          </View>
          <Text style={styles.usd}>{`≈ $${quote ? (parseFloat(quote.amountOut) * prices.to).toFixed(2) : '0.00'}`}</Text>
        </View>

        <TouchableOpacity
          style={[styles.mainBtn, ((loading && !quote) || approving) && styles.mainBtnDisabled]}
          onPress={needsApproval ? approveToken : (quote ? openConfirm : () => void getQuote({ silent: false, showIndicator: true }))}
          disabled={!amount || ((loading && !quote) || approving)}
        >
          {(approving || (loading && !quote)) ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{buttonLabel()}</Text>}
        </TouchableOpacity>

        {quoting && (
          <View style={styles.quoteHint}>
            <ActivityIndicator size="small" color="#6C8FF7" />
            <Text style={styles.quoteHintText}>{t.common.loading}</Text>
          </View>
        )}

        {quote ? (
          <View style={styles.details}>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.estimatedReceived}</Text><Text style={styles.detailValue}>{`${parseFloat(quote.amountOut).toFixed(6)} ${toToken?.symbol}`}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.minimumReceived}</Text><Text style={styles.detailValue}>{`${(parseFloat(quote.amountOut) * (1 - slippage / 100)).toFixed(6)} ${toToken?.symbol}`}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.priceImpact}</Text><Text style={styles.detailValue}>{`${quote?.priceImpact || '0'}%`}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.priceReference}</Text><Text style={styles.detailValue}>{`1 ${fromToken?.symbol} ≈ ${(parseFloat(quote.amountOut) / parseFloat(amount)).toFixed(6)} ${toToken?.symbol}`}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{`${toToken?.symbol} ${t.swap.price}`}</Text><Text style={styles.detailValue}>{prices.to > 0 ? `$${prices.to.toFixed(2)}` : '-'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.fee}</Text><Text style={styles.detailValue}>{quote?.fees ? `${(quote.fees / 10000).toFixed(2)}%` : '0.25%'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.route}</Text><Text style={styles.detailValue}>{getDexName(quote?.quoteType)}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.pool}</Text><Text style={styles.detailValue}>{quote?.path?.length > 2 ? 'Multi-Hop' : 'DIRECT'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.swapRoute}</Text><Text style={styles.detailValue}>Eagle Swap</Text></View>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showConfirmModal} transparent animationType="slide" onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t.swap.reviewSwap}</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.transaction.status}</Text><Text style={styles.detailValue}>{simulationResult?.ok ? t.common.success : simulationResult?.reason || t.common.none}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.swap.rate}</Text><Text style={styles.detailValue}>{`1 ${fromToken?.symbol} ≈ ${quote ? (parseFloat(quote.amountOut) / parseFloat(amount || '1')).toFixed(6) : '0'} ${toToken?.symbol}`}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>{t.send.gasFee}</Text><Text style={styles.detailValue}>{`~$${gasFee?.usd || '0.00'} (${gasFee?.native || '0'})`}</Text></View>
            <TouchableOpacity
              style={[styles.mainBtn, (swapping || simulating || !!(simulationResult && !simulationResult.ok)) && styles.mainBtnDisabled]}
              onPress={executeSwap}
              disabled={swapping || simulating || !!(simulationResult && !simulationResult.ok)}
            >
              {(swapping || simulating) ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{simulationResult?.ok ? t.swap.confirmSwap : t.transaction.failed}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSlippageModal} transparent animationType="slide" onRequestClose={() => setShowSlippageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t.swap.slippageTolerance}</Text>
            <View style={styles.quickRow}>
              {[0.1, 0.5, 1.0].map((v) => (
                <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setSlippage(v)}>
                  <Text style={styles.quickBtnText}>{`${v}%`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.mainBtn} onPress={() => setShowSlippageModal(false)}>
              <Text style={styles.mainBtnText}>{t.common.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, backgroundColor: '#fff' },
  side: { width: 60 },
  back: { color: '#E5B047', fontSize: 16, fontWeight: '600' },
  title: { color: '#000', fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerAction: { marginLeft: 10, padding: 6 },
  headerActionText: { color: '#666', fontSize: 16, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12 },
  label: { color: '#666', fontSize: 14, marginBottom: 4 },
  balance: { color: '#999', fontSize: 12, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tokenPill: { backgroundColor: '#F1F3F5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  tokenPillContent: { flexDirection: 'row', alignItems: 'center' },
  tokenPillLogo: { width: 20, height: 20, borderRadius: 10, marginRight: 6 },
  tokenPillLogoFallback: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D0D5DD', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  tokenPillLogoText: { color: '#344054', fontSize: 11, fontWeight: '700' },
  tokenPillText: { color: '#111', fontSize: 16, fontWeight: '700' },
  input: { flex: 1, textAlign: 'right', color: '#111', fontSize: 28, fontWeight: '700' },
  readonly: { color: '#333' },
  quickRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  quickBtn: { backgroundColor: '#F2F4F7', borderRadius: 10, borderWidth: 1, borderColor: '#E4E7EC', paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
  quickBtnText: { color: '#667085', fontSize: 12, fontWeight: '600' },
  quickBtnMax: { backgroundColor: '#E8F5F1', borderColor: '#BDE8D9' },
  quickBtnMaxText: { color: '#1F9D75' },
  usd: { color: '#999', textAlign: 'right', marginTop: 8, fontSize: 14 },
  switchBtn: { alignSelf: 'center', backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: -8, marginBottom: 6 },
  switchBtnText: { color: '#666', fontSize: 16, fontWeight: '700' },
  mainBtn: { backgroundColor: '#6C8FF7', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, marginBottom: 12 },
  mainBtnDisabled: { opacity: 0.65 },
  mainBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  quoteHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quoteHintText: { color: '#667085', marginLeft: 8, fontSize: 12, fontWeight: '600' },
  details: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailLabel: { color: '#666', fontSize: 14 },
  detailValue: { color: '#111', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { color: '#111', fontSize: 20, fontWeight: '700', marginBottom: 16 },
});
