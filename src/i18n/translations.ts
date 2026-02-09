/**
 * Eagle Wallet - Translations Index
 * Exports all language translations
 */

import { Language, TranslationStrings } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { zhTW } from './locales/zh-TW';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { vi } from './locales/vi';
import { ru } from './locales/ru';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { ar } from './locales/ar';
import { pt } from './locales/pt';
import { it } from './locales/it';
import { tr } from './locales/tr';
import { th } from './locales/th';
import { id } from './locales/id';
import { hi } from './locales/hi';
import { uk } from './locales/uk';

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
  hi,
  uk,
};

export type { Language, TranslationStrings };
