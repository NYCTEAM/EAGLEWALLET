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
import { ethers } from 'ethers';
import { useLanguage } from '../i18n/LanguageContext';

export default function EnterAddressScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const token = route.params?.token;
  const [address, setAddress] = useState('');

  const goNext = () => {
    if (!ethers.isAddress(address.trim())) {
      Alert.alert(t.common.error, t.errors.invalidAddress);
      return;
    }

    navigation.navigate('EnterAmount', {
      token,
      recipientAddress: address.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.send.recipientAddress}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t.send.recipientAddress}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          placeholder="0x..."
          placeholderTextColor="#8D95AC"
        />

        <TouchableOpacity style={styles.button} onPress={goNext}>
          <Text style={styles.buttonText}>{t.common.next}</Text>
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
  label: { color: '#D8DEEE', marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#151515', fontSize: 14, fontWeight: '700' },
});
