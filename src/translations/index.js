/**
 * Translation loader for multi-language support
 *
 * This module provides functions to load and merge translations
 * for different locales with English as the fallback.
 */

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../context/localeContext';
import en from './en.json';
import es from './es.json';

// All available translations
const translations = {
  en,
  es,
};

/**
 * Get messages for a specific locale with English fallback
 * Missing keys in the target locale will use English values
 *
 * @param {string} locale - Locale code ('en', 'es')
 * @param {Object} hostedTranslations - Optional hosted translations from Sharetribe Console
 * @returns {Object} - Merged translation messages
 */
export const getMessages = (locale, hostedTranslations = {}) => {
  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const localeMessages = translations[validLocale] || {};
  const defaultMessages = translations[DEFAULT_LOCALE] || {};

  // For the default locale (English), apply hosted translations on top
  // For other locales, use locale-specific translations (hosted translations are English-only)
  if (validLocale === DEFAULT_LOCALE) {
    // Priority: hostedTranslations > localeMessages > defaultMessages
    return {
      ...defaultMessages,
      ...localeMessages,
      ...hostedTranslations,
    };
  }

  // For non-default locales: localeMessages > defaultMessages (English fallback)
  // Don't apply hostedTranslations as they are English-only
  return {
    ...defaultMessages,
    ...localeMessages,
  };
};

/**
 * Get raw messages for a locale without fallback
 * @param {string} locale - Locale code
 * @returns {Object} - Translation messages for that locale only
 */
export const getRawMessages = locale => {
  return translations[locale] || {};
};

/**
 * Check if a translation key exists for a locale
 * @param {string} locale - Locale code
 * @param {string} key - Translation key
 * @returns {boolean}
 */
export const hasTranslation = (locale, key) => {
  const messages = translations[locale];
  return messages && key in messages;
};

/**
 * Get all available locales
 * @returns {string[]}
 */
export const getAvailableLocales = () => SUPPORTED_LOCALES;

export default translations;
