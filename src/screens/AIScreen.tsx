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
import { useLanguage } from '../i18n/LanguageContext';
import WalletService from '../services/WalletService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

type Tier = 'free' | 'holder' | 'vip' | 'pro';

const TIER_LIMITS = {
  free: 5000,
  holder: 10000,
  vip: 50000,
  pro: 100000,
};

const DEVICE_ID_KEY = 'EAGLE_DEVICE_ID';

export default function AIScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Tier State
  const [currentTier, setCurrentTier] = useState<Tier>('free');
  const [tokensUsed, setTokensUsed] = useState(0);
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
      // 1. Get or Create Device ID (for Free Tier lock)
      let dId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!dId) {
        dId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
        await AsyncStorage.setItem(DEVICE_ID_KEY, dId);
      }
      setDeviceId(dId);

      // 2. Get Wallet Address
      const address = await WalletService.getAddress();
      if (address) setWalletAddress(address);

      // 3. Determine Tier (Mocked logic - normally would check API/Contract)
      // In real app: await checkUserTier(address);
      const tier: Tier = 'free'; 
      setCurrentTier(tier);

      // 4. Load Usage
      await loadUsage(tier, dId, address || '');
    } catch (error) {
      console.error('Failed to init AI user:', error);
    }
  };

  const loadUsage = async (tier: Tier, dId: string, address: string) => {
    const today = new Date().toISOString().split('T')[0];
    let usageKey = '';

    // Logic: Free users track by DEVICE_ID, Paid users track by WALLET_ADDRESS
    if (tier === 'free') {
      usageKey = `AI_USAGE_${today}_DEVICE_${dId}`;
    } else {
      usageKey = `AI_USAGE_${today}_WALLET_${address}`;
    }

    const savedUsage = await AsyncStorage.getItem(usageKey);
    setTokensUsed(savedUsage ? parseInt(savedUsage) : 0);
  };

  const updateUsage = async (newAmount: number) => {
    const today = new Date().toISOString().split('T')[0];
    let usageKey = '';

    if (currentTier === 'free') {
      usageKey = `AI_USAGE_${today}_DEVICE_${deviceId}`;
    } else {
      usageKey = `AI_USAGE_${today}_WALLET_${walletAddress}`;
    }

    setTokensUsed(newAmount);
    await AsyncStorage.setItem(usageKey, newAmount.toString());
  };

  const dailyLimit = TIER_LIMITS[currentTier];
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
    
    // Update usage
    const cost = userMessage.text.length + 50;
    const newUsage = tokensUsed + cost;
    updateUsage(newUsage);

    // Simulate AI response
    setTimeout(() => {
      const responseText = getSimulatedResponse(userMessage.text);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
      
      // Update usage again
      const finalUsage = newUsage + responseText.length;
      updateUsage(finalUsage);
    }, 1500);
  };

  const getSimulatedResponse = (query: string) => {
    const q = query.toLowerCase();
    
    // Simple language detection (check for common Chinese characters)
    const isChinese = /[\u4e00-\u9fa5]/.test(query);

    if (isChinese) {
        if (q.includes('你好') || q.includes('hello')) {
            return '你好！我是 Eagle AI，你的智能加密助手。有什么我可以帮你的吗？你可以问我关于比特币价格、钱包安全或者市场分析的问题。';
        }
        if (q.includes('btc') || q.includes('比特币')) {
            return '比特币 (BTC) 目前表现强劲，支撑位在 $42,000 左右。近期 ETF 的资金流入带来了积极的市场情绪。不过 RSI 指标显示短期内可能略有超买。';
        }
        if (q.includes('eth') || q.includes('以太坊')) {
            return '以太坊 (ETH) 走势紧随比特币。即将到来的网络升级（Dencun）引发了市场的积极关注。请关注 $2,500 附近的阻力位。';
        }
        if (q.includes('安全') || q.includes('私钥') || q.includes('助记词')) {
            return 'Eagle Wallet 采用行业标准的加密技术。请务必记住：永远不要将你的私钥或助记词分享给任何人，包括官方客服。建议你在设置中开启生物识别验证。';
        }
        if (q.includes('价格') || q.includes('涨') || q.includes('跌')) {
            return '作为一个 AI 助手，我无法准确预测未来的具体价格。目前的市场趋势显示出一定的盘整迹象。投资加密货币有风险，请务必做好自己的研究 (DYOR)。';
        }
        return '这是一个很好的问题。但我目前的知识库还在更新中。你可以试着问我："比特币现在的行情如何？" 或者 "如何保护我的钱包？"';
    } else {
        // English Responses
        if (q.includes('hello') || q.includes('hi')) {
            return 'Hello! I am Eagle AI, your smart crypto assistant. How can I help you? You can ask me about BTC prices, wallet security, or market analysis.';
        }
        if (q.includes('btc') || q.includes('bitcoin')) {
            return 'Bitcoin (BTC) is showing strong support at $42,000. Market sentiment remains bullish due to recent ETF inflows. RSI indicates it might be slightly overbought in the short term.';
        }
        if (q.includes('eth') || q.includes('ethereum')) {
            return 'Ethereum (ETH) is tracking BTC movements. The upcoming network upgrade is generating positive buzz. Watch resistance at $2,500.';
        }
        if (q.includes('security') || q.includes('safe') || q.includes('key')) {
            return 'Eagle Wallet uses industry-standard encryption. Remember to never share your private key or mnemonic phrase with anyone. Check our Security Center in Settings for more tips.';
        }
        if (q.includes('price')) {
            return 'I cannot predict future prices with certainty, but current market trends suggest a period of consolidation. Always do your own research (DYOR).';
        }
        return 'That is an interesting question. As an AI assistant, I am here to help with crypto insights, market analysis, and wallet security features. Could you please provide more details?';
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
          
          <TouchableOpacity style={styles.tierOption} onPress={() => { setCurrentTier('holder'); setShowUpgradeModal(false); }}>
            <View style={styles.tierHeader}>
              <Icon name="wallet-membership" size={24} color="#F3BA2F" />
              <Text style={styles.tierName}>{t.ai.holder}</Text>
            </View>
            <Text style={styles.tierDesc}>Hold 50+ EAGLE</Text>
            <Text style={styles.tierLimit}>10,000 Tokens/Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tierOption} onPress={() => { setCurrentTier('vip'); setShowUpgradeModal(false); }}>
            <View style={styles.tierHeader}>
              <Icon name="crown" size={24} color="#9C27B0" />
              <Text style={styles.tierName}>{t.ai.vip}</Text>
            </View>
            <Text style={styles.tierDesc}>Hold Eagle NFT</Text>
            <Text style={styles.tierLimit}>50,000 Tokens/Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tierOption} onPress={() => { setCurrentTier('pro'); setShowUpgradeModal(false); }}>
            <View style={styles.tierHeader}>
              <Icon name="star" size={24} color="#2196F3" />
              <Text style={styles.tierName}>{t.ai.pro}</Text>
            </View>
            <Text style={styles.tierDesc}>Subscribe with EAGLE</Text>
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
