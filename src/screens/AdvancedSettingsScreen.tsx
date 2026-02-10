import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n/LanguageContext';

const SETTINGS_KEY = 'EAGLE_ADVANCED_SETTINGS';

interface AdvancedPrefs {
  displayTestnet: boolean;
  analytics: boolean;
  autoLockMinutes: number;
}

const DEFAULT_PREFS: AdvancedPrefs = {
  displayTestnet: false,
  analytics: true,
  autoLockMinutes: 5,
};

export default function AdvancedSettingsScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<AdvancedPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      }
    })();
  }, []);

  const save = async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
    Alert.alert(t.common.success, t.common.save, [
      { text: t.common.done, onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.advancedSettings}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>{t.settings.displayTestnet}</Text>
            <Text style={styles.rowSub}>{t.settings.advancedWarning}</Text>
          </View>
          <Switch
            value={prefs.displayTestnet}
            onValueChange={(value) => setPrefs((prev) => ({ ...prev, displayTestnet: value }))}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>{t.settings.analytics}</Text>
            <Text style={styles.rowSub}>{t.settings.analyticsSubtitle}</Text>
          </View>
          <Switch
            value={prefs.analytics}
            onValueChange={(value) => setPrefs((prev) => ({ ...prev, analytics: value }))}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.rowTitle}>{t.settings.autoLock}</Text>
          <Text style={styles.rowSub}>{t.settings.autoLockSubtitle}</Text>
          <TextInput
            style={styles.input}
            value={String(prefs.autoLockMinutes)}
            onChangeText={(value) => {
              const parsed = Number(value);
              if (!Number.isNaN(parsed)) {
                setPrefs((prev) => ({ ...prev, autoLockMinutes: parsed }));
              }
            }}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={save}>
          <Text style={styles.saveText}>{t.common.save}</Text>
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
  row: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTextWrap: { flex: 1, paddingRight: 10 },
  rowTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  rowSub: { color: '#9AA2B9', fontSize: 11, marginTop: 2 },
  inputBlock: {
    backgroundColor: '#1A1D29',
    borderWidth: 1,
    borderColor: '#2E3550',
    borderRadius: 10,
    padding: 12,
  },
  input: {
    marginTop: 8,
    backgroundColor: '#121726',
    borderWidth: 1,
    borderColor: '#344063',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#E9B949',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveText: { color: '#151515', fontSize: 14, fontWeight: '700' },
});
