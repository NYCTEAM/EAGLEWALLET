/**
 * Eagle Wallet - Language Context
 * Multi-language support system
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationStrings } from './translations';

const LANGUAGE_KEY = 'EAGLE_LANGUAGE';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationStrings;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'zh' as Language, name: 'Chinese', nativeName: '中文' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français' },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch' },
  { code: 'ja' as Language, name: 'Japanese', nativeName: '日本語' },
  { code: 'ko' as Language, name: 'Korean', nativeName: '한국어' },
  { code: 'ru' as Language, name: 'Russian', nativeName: 'Русский' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Português' },
  { code: 'it' as Language, name: 'Italian', nativeName: 'Italiano' },
  { code: 'tr' as Language, name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi' as Language, name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th' as Language, name: 'Thai', nativeName: 'ไทย' },
  { code: 'id' as Language, name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved && translations[saved as Language]) {
        setLanguageState(saved as Language);
      }
    } catch (error) {
      console.error('Load language error:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Set language error:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
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
