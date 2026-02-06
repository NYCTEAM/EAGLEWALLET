/**
 * Eagle Wallet - Translations Index
 * Exports all language translations
 */

import { Language, TranslationStrings } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';

// Create complete translations for other languages based on zh
const zhTW: TranslationStrings = { ...zh }; // Will be replaced with proper Traditional Chinese
const ja: TranslationStrings = { ...en }; // Japanese - using English for now
const es: TranslationStrings = { ...en }; // Spanish - using English for now

// Use English as fallback for remaining languages
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
