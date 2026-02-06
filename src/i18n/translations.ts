/**
 * Eagle Wallet - Translations Index
 * Exports all language translations
 */

import { Language, TranslationStrings } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { zhTW } from './locales/zh-TW';
import { ja } from './locales/ja';
import { es } from './locales/es';

// Use English as fallback for languages not yet fully translated
const fr: TranslationStrings = { ...en }; // French
const de: TranslationStrings = { ...en }; // German
const ko: TranslationStrings = { ...en }; // Korean
const ru: TranslationStrings = { ...en }; // Russian
const ar: TranslationStrings = { ...en }; // Arabic
const pt: TranslationStrings = { ...en }; // Portuguese
const it: TranslationStrings = { ...en }; // Italian
const tr: TranslationStrings = { ...en }; // Turkish
const vi: TranslationStrings = { ...en }; // Vietnamese
const th: TranslationStrings = { ...en }; // Thai
const id: TranslationStrings = { ...en }; // Indonesian

export const translations: Record<Language, TranslationStrings> = {
  en,
  zh,
  'zh-TW': zhTW,
  es,
  fr,
  de,
  ja,
  ko,
  ru,
  ar,
  pt,
  it,
  tr,
  vi,
  th,
  id,
};

export type { Language, TranslationStrings };
