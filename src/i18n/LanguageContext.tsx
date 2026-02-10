/**
 * Eagle Wallet - Language Context
 * Multi-language support system
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, NativeModules, Platform } from 'react-native';
import { translations, Language, TranslationStrings } from './translations';

const LANGUAGE_KEY = 'EAGLE_LANGUAGE';
const RTL_LANGUAGES: Language[] = ['ar'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationStrings;
  availableLanguages: { code: Language; name: string; nativeName: string; isRTL: boolean }[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', isRTL: false },
  { code: 'zh' as Language, name: 'Chinese (Simplified)', nativeName: 'Simplified Chinese', isRTL: false },
  { code: 'zh-TW' as Language, name: 'Chinese (Traditional)', nativeName: 'Traditional Chinese', isRTL: false },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Spanish', isRTL: false },
  { code: 'fr' as Language, name: 'French', nativeName: 'French', isRTL: false },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch', isRTL: false },
  { code: 'ja' as Language, name: 'Japanese', nativeName: 'Japanese', isRTL: false },
  { code: 'ko' as Language, name: 'Korean', nativeName: 'Korean', isRTL: false },
  { code: 'ru' as Language, name: 'Russian', nativeName: 'Russian', isRTL: false },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'Arabic', isRTL: true },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Portuguese', isRTL: false },
  { code: 'it' as Language, name: 'Italian', nativeName: 'Italiano', isRTL: false },
  { code: 'tr' as Language, name: 'Turkish', nativeName: 'Turkish', isRTL: false },
  { code: 'vi' as Language, name: 'Vietnamese', nativeName: 'Vietnamese', isRTL: false },
  { code: 'th' as Language, name: 'Thai', nativeName: 'Thai', isRTL: false },
  { code: 'id' as Language, name: 'Indonesian', nativeName: 'Bahasa Indonesia', isRTL: false },
  { code: 'hi' as Language, name: 'Hindi', nativeName: 'Hindi', isRTL: false },
  { code: 'uk' as Language, name: 'Ukrainian', nativeName: 'Ukrainian', isRTL: false },
];

function getDeviceLanguage(): Language {
  try {
    const deviceLanguage =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    if (!deviceLanguage) {
      return 'en';
    }

    const langCode = deviceLanguage.split(/[-_]/)[0].toLowerCase();

    if (langCode === 'zh') {
      if (
        deviceLanguage.includes('TW') ||
        deviceLanguage.includes('HK') ||
        deviceLanguage.includes('Hant')
      ) {
        return 'zh-TW';
      }
      return 'zh';
    }

    const languageMap: Record<string, Language> = {
      en: 'en',
      zh: 'zh',
      es: 'es',
      fr: 'fr',
      de: 'de',
      ja: 'ja',
      ko: 'ko',
      ru: 'ru',
      ar: 'ar',
      pt: 'pt',
      it: 'it',
      tr: 'tr',
      vi: 'vi',
      th: 'th',
      id: 'id',
      hi: 'hi',
      uk: 'uk',
    };

    return languageMap[langCode] || 'en';
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved && translations[saved as Language]) {
          setLanguageState(saved as Language);
          updateRTL(saved as Language);
          return;
        }

        const deviceLang = getDeviceLanguage();
        setLanguageState(deviceLang);
        updateRTL(deviceLang);
      } catch (error) {
        console.error('Load language error:', error);
      }
    };

    loadLanguage();
  }, []);

  const updateRTL = (lang: Language) => {
    const isRTL = RTL_LANGUAGES.includes(lang);
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // App restart is required for full RTL reflow.
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
      updateRTL(lang);
    } catch (error) {
      console.error('Set language error:', error);
    }
  };

  const isRTL = RTL_LANGUAGES.includes(language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        availableLanguages,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
