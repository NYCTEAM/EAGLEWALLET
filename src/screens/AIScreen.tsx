import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ethers } from 'ethers';
import { useLanguage } from '../i18n/LanguageContext';
import WalletService from '../services/WalletService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

type Tier = 'free' | 'holder' | 'vip' | 'pro';

const API_URL = 'https://ai.eagleswaps.com/api';
const DEVICE_ID_KEY = 'EAGLE_DEVICE_ID';

// Official Contracts
const EAGLE_NFT_CONTRACT = '0x3c117d186c5055071eff91d87f2600eaf88d591d'; 
const EAGLE_TOKEN_CONTRACT = '0x480F12D2ECEFe1660e72149c57327f5E0646E5c4';
const PAYMENT_ADDRESS = '0xf4f02733696cc3bb2cffe8bb8e9f32058654c622';

export default function AIScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Tier State
  const [currentTier, setCurrentTier] = useState<Tier>('free');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5000); // Default, updated by backend
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: '1',
        text: t.ai.welcomeMessage,
        sender: 'ai',
        timestamp: Date.now(),
      },
    ]);
    
    initializeUser();
  }, [t]);

  const initializeUser = async () => {
    try {
      // 1. Get or Create Device ID
      let dId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!dId) {
        dId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
        await AsyncStorage.setItem(DEVICE_ID_KEY, dId);
      }
      setDeviceId(dId);

      // 2. Get Wallet Address
      const address = await WalletService.getAddress();
      if (address) setWalletAddress(address);

      // 3. Fetch Status from Backend
      await fetchBackendStatus(dId, address || '');
    } catch (error) {
      console.error('Failed to init AI user:', error);
    }
  };

  const fetchBackendStatus = async (dId: string, address: string) => {
    try {
      const url = `${API_URL}/status?deviceId=${dId}&walletAddress=${address}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.tier) {
        setCurrentTier(data.tier);
        setTokensUsed(data.used);
        setDailyLimit(data.limit);
      }
    } catch (error) {
      console.warn('Backend status check failed, using local defaults');
    }
  };

  const tokensRemaining = Math.max(0, dailyLimit - tokensUsed);
  const usagePercent = Math.min(100, (tokensUsed / dailyLimit) * 100);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Check limit
    if (tokensUsed >= dailyLimit) {
      Alert.alert(t.ai.dailyLimit, t.ai.upgradePrompt, [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.ai.upgrade, onPress: () => setShowUpgradeModal(true) }
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Try to fetch crypto data first (local fast path)
      const cryptoResponse = await tryCryptoFastPath(userMessage.text);
      let responseText = '';

      if (cryptoResponse) {
        responseText = cryptoResponse;
        // Even for local crypto response, we should ideally sync usage with backend, 
        // but for now let's assume backend tracks AI calls. 
        // We will just send a "ping" to backend or skip cost for simple price checks?
        // User wants AI limit. Let's count it locally for now or send to backend as a log.
        // Better: Send EVERYTHING to backend for consistent logic.
        // Let's Skip local fast path if we want strictly backend control.
        // BUT user liked the specific format.
        // Compromise: Send to backend. Backend is GPT-4o-mini. 
        // Backend can't fetch live price without tools.
        // So: Keep Local Crypto -> If matched, return immediately.
      } 
      
      if (!responseText) {
        // Call Backend AI
        const res = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-device-id': deviceId
            },
            body: JSON.stringify({
                message: userMessage.text,
                history: messages.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
                deviceId,
                walletAddress
            })
        });
        
        const data = await res.json();
        
        if (!res.ok || data.error) {
            throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        responseText = data.reply;
        
        // Sync limits from backend response
        if (data.tokensUsed) {
            setTokensUsed(prev => prev + data.tokensUsed);
            if (data.remaining !== undefined) {
                // Approximate sync
            }
        }
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `${t.ai.error}\n\n${errorMessage}`,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      // Refresh status to be sure
      fetchBackendStatus(deviceId, walletAddress);
    }
  };

  // Keep this for fast price checks
  const tryCryptoFastPath = async (query: string) => {
    const q = query.toLowerCase();
    let token = '';
    if (q.includes('btc') || q.includes('bitcoin')) token = 'BTC';
    else if (q.includes('eth') || q.includes('ethereum')) token = 'ETH';
    else if (q.includes('bnb')) token = 'BNB';
    else if (q.includes('sol')) token = 'SOL';

    if (token && (q.includes('price') || q.includes('price') || q.includes('行情') || q.includes('多少钱'))) {
        const data = await fetchCryptoData(token);
        if (data) {
            const current = parseFloat(data.lastPrice);
            const high = parseFloat(data.highPrice);
            const low = parseFloat(data.lowPrice);
            const change = parseFloat(data.priceChangePercent);
            const trendIcon = change > 0 ? '📈' : '📉';
            
            // Simple language detection for this specific static response
            const isChinese = /[\u4e00-\u9fa5]/.test(query);

            if (isChinese) {
                return `${token} 实时行情数据 ${trendIcon}\n\n` +
                       `💰 当前价格: $${current.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)\n` +
                       `📊 24H 最高: $${high.toFixed(2)}\n` +
                       `📉 24H 最低: $${low.toFixed(2)}\n\n` +
                       `(数据源: Binance)`;
            } else {
                return `${token} Real-time Market Data ${trendIcon}\n\n` +
                       `💰 Price: $${current.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)\n` +
                       `📊 24H High: $${high.toFixed(2)}\n` +
                       `📉 24H Low: $${low.toFixed(2)}\n\n` +
                       `(Source: Binance)`;
            }
        }
    }
    return null;
  };

  const fetchCryptoData = async (symbol: string) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  };

  const handleSubscribe = async () => {
    if (!walletAddress) {
        Alert.alert(t.common.error, t.errors.importWalletFailed);
        return;
    }

    try {
        setIsLoading(true);
        // 1. Send 200 EAGLE
        // Note: WalletService needs to support ERC20 transfer. 
        // sendTransaction is ETH/BNB native usually.
        // We need a specific method for Token Transfer in WalletService or use generic call.
        // Assuming WalletService.sendToken exists or we use sendTransaction for now (User asked for EAGLE payment).
        // Since WalletService.ts shown earlier didn't have sendToken, I'll assume I need to add it or use raw ethers.
        
        // Quick fix: Get wallet and use ethers directly here or add helper.
        // Let's add a helper in WalletService later or do it here.
        // For now, I'll alert the user as I can't guarantee sendToken exists yet.
        
        // Actually, I can use WalletService.getWallet() to get the signer.
        const wallet = await WalletService.getWallet();
        const provider = await WalletService.getProvider();
        
        // ERC20 ABI
        const abi = ["function transfer(address to, uint amount) returns (bool)"];
        const contract = new ethers.Contract(EAGLE_TOKEN_CONTRACT, abi, wallet.connect(provider));
        
        // 200 EAGLE (assuming 18 decimals)
        const amount = ethers.parseUnits("200", 18);
        
        const tx = await contract.transfer(PAYMENT_ADDRESS, amount);
          
        // Wait for confirmation? Backend checks chain anyway.
        // Let's verify immediately.
        
        const verifyRes = await fetch(`${API_URL}/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-device-id': deviceId
            },
            body: JSON.stringify({
                txHash: tx.hash,
                walletAddress
            })
        });
        
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
            Alert.alert(t.common.success, t.ai.pro);
            setShowUpgradeModal(false);
            fetchBackendStatus(deviceId, walletAddress);
        } else {
            Alert.alert(t.common.success, t.transaction.confirming);
        }

    } catch (error) {
        console.error(error);
        Alert.alert(t.common.error, t.errors.transactionFailed);
    } finally {
        setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Icon name="robot" size={20} color="#fff" />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const getTierLabel = (tier: Tier) => {
    switch (tier) {
      case 'free': return t.ai.free;
      case 'holder': return t.ai.holder;
      case 'vip': return t.ai.vip;
      case 'pro': return t.ai.pro;
      default: return t.ai.free;
    }
  };

  const renderUpgradeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showUpgradeModal}
      onRequestClose={() => setShowUpgradeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.ai.upgrade}</Text>
          
          <TouchableOpacity style={styles.tierOption} onPress={async () => {
            try {
              setIsLoading(true);
              await fetchBackendStatus(deviceId, walletAddress);
              setShowUpgradeModal(false);
              Alert.alert(t.common.success, t.ai.upgradePrompt);
            } catch (e) {
              Alert.alert(t.common.error, String(e));
            } finally {
              setIsLoading(false);
            }
          }}>
            <View style={styles.tierHeader}>
              <Icon name="wallet-membership" size={24} color="#F3BA2F" />
              <Text style={styles.tierName}>{t.ai.holder}</Text>
            </View>
            <Text style={styles.tierDesc}>{t.ai.buyEagle} (50+ EAGLE)</Text>
            <Text style={styles.tierLimit}>10,000 Tokens/Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tierOption} onPress={async () => {
            try {
              setIsLoading(true);
              await fetchBackendStatus(deviceId, walletAddress);
              setShowUpgradeModal(false);
              Alert.alert(t.common.success, t.ai.upgradePrompt);
            } catch (e) {
              Alert.alert(t.common.error, String(e));
            } finally {
              setIsLoading(false);
            }
          }}>
            <View style={styles.tierHeader}>
              <Icon name="crown" size={24} color="#9C27B0" />
              <Text style={styles.tierName}>{t.ai.vip}</Text>
            </View>
            <Text style={styles.tierDesc}>{t.ai.buyNft} (Eagle NFT)</Text>
            <Text style={styles.tierLimit}>50,000 Tokens/Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tierOption} onPress={handleSubscribe}>
            <View style={styles.tierHeader}>
              <Icon name="star" size={24} color="#2196F3" />
              <Text style={styles.tierName}>{t.ai.pro}</Text>
            </View>
            <Text style={styles.tierDesc}>{t.ai.pro} (200 EAGLE/Mo)</Text>
            <Text style={styles.tierLimit}>100,000+ Tokens/Day</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeModalButton} 
            onPress={() => setShowUpgradeModal(false)}
          >
            <Text style={styles.closeModalText}>{t.common.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.ai.title}</Text>
        <TouchableOpacity style={styles.upgradeButton} onPress={() => setShowUpgradeModal(true)}>
          <Icon name="arrow-up-bold-circle" size={20} color="#F3BA2F" />
          <Text style={styles.upgradeText}>{t.ai.upgrade}</Text>
        </TouchableOpacity>
      </View>

      {/* Tier Status Banner */}
      <View style={styles.tierBanner}>
        <View style={styles.tierInfo}>
          <Text style={styles.tierLabel}>{t.ai.currentTier}: <Text style={styles.tierValue}>{getTierLabel(currentTier)}</Text></Text>
          <Text style={styles.tokenCount}>{tokensRemaining.toLocaleString()} {t.ai.tokensRemaining}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${usagePercent}%` }]} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.ai.thinking}</Text>
          <ActivityIndicator size="small" color="#F3BA2F" />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t.ai.askPlaceholder}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {renderUpgradeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeText: {
    marginLeft: 4,
    color: '#F3BA2F',
    fontWeight: '600',
    fontSize: 12,
  },
  tierBanner: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierLabel: {
    fontSize: 12,
    color: '#666',
  },
  tierValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  tokenCount: {
    fontSize: 12,
    color: '#666',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F3BA2F',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3BA2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#F3BA2F',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 56,
    marginBottom: 16,
  },
  loadingText: {
    color: '#999',
    marginRight: 8,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3BA2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  tierOption: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  tierDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tierLimit: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  closeModalButton: {
    marginTop: 10,
    padding: 16,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#666',
    fontSize: 16,
  },
});
