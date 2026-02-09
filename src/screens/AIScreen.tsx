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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../i18n/LanguageContext';

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
  pro: 100000, // Unlimited or high cap
};

export default function AIScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Tier State (Mocked for now)
  const [currentTier, setCurrentTier] = useState<Tier>('free');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
  }, [t]);

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
    
    // Simulate token usage (approx 1 token per char)
    setTokensUsed(prev => prev + userMessage.text.length + 50); // +50 for base cost

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
      
      // Add response tokens
      setTokensUsed(prev => prev + responseText.length);
    }, 1500);
  };

  const getSimulatedResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('btc') || q.includes('bitcoin')) {
      return 'Bitcoin (BTC) is showing strong support at $42,000. Market sentiment remains bullish due to recent ETF inflows. RSI indicates it might be slightly overbought in the short term.';
    }
    if (q.includes('eth') || q.includes('ethereum')) {
      return 'Ethereum (ETH) is tracking BTC movements. The upcoming network upgrade is generating positive buzz. Watch resistance at $2,500.';
    }
    if (q.includes('security') || q.includes('safe')) {
      return 'Eagle Wallet uses industry-standard encryption. Remember to never share your private key or mnemonic phrase with anyone. Check our Security Center in Settings for more tips.';
    }
    if (q.includes('price')) {
      return 'I cannot predict future prices with certainty, but current market trends suggest a period of consolidation. Always do your own research (DYOR).';
    }
    return 'That is an interesting question. As an AI assistant, I am here to help with crypto insights, market analysis, and wallet security features. Could you please provide more details?';
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
