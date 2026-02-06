/**
 * Eagle Wallet - Add Wallet Screen
 * Create new wallet or import existing wallet with custom name
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MultiWalletService from '../services/MultiWalletService';

export default function AddWalletScreen({ navigation }: any) {
  const [walletName, setWalletName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [mode, setMode] = useState<'create' | 'import-mnemonic' | 'import-key'>('create');
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert('错误', '请输入钱包名称');
      return;
    }

    if (!password) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      Alert.alert('错误', '密码至少需要8个字符');
      return;
    }

    try {
      setLoading(true);
      const wallet = await MultiWalletService.createWallet(walletName.trim(), password);
      
      Alert.alert(
        '成功',
        `钱包 "${walletName}" 创建成功！\n\n请务必备份您的助记词和私钥。您可以在设置中查看和导出。`,
        [
          {
            text: '确定',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('错误', error.message || '创建钱包失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImportMnemonic = async () => {
    if (!walletName.trim()) {
      Alert.alert('错误', '请输入钱包名称');
      return;
    }

    if (!password) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    if (!mnemonic.trim()) {
      Alert.alert('错误', '请输入助记词');
      return;
    }

    try {
      setLoading(true);
      await MultiWalletService.importFromMnemonic(walletName.trim(), mnemonic.trim(), password);
      
      Alert.alert('成功', `钱包 "${walletName}" 导入成功！`, [
        {
          text: '确定',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message || '导入钱包失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPrivateKey = async () => {
    if (!walletName.trim()) {
      Alert.alert('错误', '请输入钱包名称');
      return;
    }

    if (!password) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    if (!privateKey.trim()) {
      Alert.alert('错误', '请输入私钥');
      return;
    }

    try {
      setLoading(true);
      await MultiWalletService.importFromPrivateKey(walletName.trim(), privateKey.trim(), password);
      
      Alert.alert('成功', `钱包 "${walletName}" 导入成功！`, [
        {
          text: '确定',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message || '导入钱包失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'create') {
      handleCreateWallet();
    } else if (mode === 'import-mnemonic') {
      handleImportMnemonic();
    } else {
      handleImportPrivateKey();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {mode === 'create' ? '创建钱包' : '导入钱包'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.modeButtonActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.modeButtonText, mode === 'create' && styles.modeButtonTextActive]}>
              创建新钱包
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'import-mnemonic' && styles.modeButtonActive]}
            onPress={() => setMode('import-mnemonic')}
          >
            <Text style={[styles.modeButtonText, mode === 'import-mnemonic' && styles.modeButtonTextActive]}>
              导入助记词
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'import-key' && styles.modeButtonActive]}
            onPress={() => setMode('import-key')}
          >
            <Text style={[styles.modeButtonText, mode === 'import-key' && styles.modeButtonTextActive]}>
              导入私钥
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>钱包名称 *</Text>
          <TextInput
            style={styles.input}
            placeholder="例如：我的主钱包"
            value={walletName}
            onChangeText={setWalletName}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>给您的钱包起一个容易识别的名字</Text>
        </View>

        {/* Import Mnemonic */}
        {mode === 'import-mnemonic' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>助记词 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入12或24个助记词，用空格分隔"
              value={mnemonic}
              onChangeText={setMnemonic}
              multiline
              numberOfLines={4}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        {/* Import Private Key */}
        {mode === 'import-key' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>私钥 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="请输入私钥（以0x开头）"
              value={privateKey}
              onChangeText={setPrivateKey}
              multiline
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>
        )}

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>密码 *</Text>
          <TextInput
            style={styles.input}
            placeholder="至少8个字符"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>确认密码 *</Text>
          <TextInput
            style={styles.input}
            placeholder="再次输入密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Warning */}
        {mode === 'create' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              请务必备份您的助记词！助记词是恢复钱包的唯一方式，丢失后将无法找回资产。
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'create' ? '创建钱包' : '导入钱包'}
            </Text>
          )}
        </TouchableOpacity>
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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#F3BA2F',
  },
  modeButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#F3BA2F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
