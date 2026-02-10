import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

export default function ChangePasswordScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t.common.error, t.errors.passwordRequired);
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t.common.error, t.errors.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t.common.error, t.errors.passwordMismatch);
      return;
    }

    setSaving(true);
    try {
      const changed = await WalletService.changePassword(oldPassword, newPassword);
      if (!changed) {
        Alert.alert(t.common.error, t.errors.invalidInput);
        return;
      }

      Alert.alert(t.common.success, t.settings.changePassword, [
        { text: t.common.done, onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.message || t.errors.unknownError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.changePassword}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t.wallet.password}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder={t.wallet.passwordPlaceholder}
          placeholderTextColor="#8A92A8"
        />

        <Text style={styles.label}>{t.settings.changePassword}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t.wallet.passwordPlaceholder}
          placeholderTextColor="#8A92A8"
        />

        <Text style={styles.label}>{t.wallet.confirmPassword}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t.wallet.confirmPasswordPlaceholder}
          placeholderTextColor="#8A92A8"
        />

        <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? t.common.loading : t.common.save}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1014' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2230',
  },
  back: { color: '#E9B949', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  content: { padding: 16 },
  label: {
    color: '#D8DEEE',
    marginBottom: 8,
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2F3550',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#161616',
    fontWeight: '700',
    fontSize: 14,
  },
});
