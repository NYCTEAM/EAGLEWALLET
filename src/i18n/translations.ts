/**
 * Eagle Wallet - Translations Index
 * Exports all language translations
 */

import { Language, TranslationStrings } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { ja } from './locales/ja';

// Use English as fallback for languages not yet fully translated
// These will be replaced with full translations in future updates
const es: TranslationStrings = { ...en }; // Spanish
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
