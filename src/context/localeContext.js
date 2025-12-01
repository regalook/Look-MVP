import { createContext, useContext } from 'react';

import {
  createResourceLocatorString as originalCreateResourceLocatorString,
  pathByRouteName as originalPathByRouteName,
} from '../util/routes';

// Supported locales configuration
export const SUPPORTED_LOCALES = ['en', 'es'];
export const DEFAULT_LOCALE = 'en';

// Locale display names for UI
export const LOCALE_LABELS = {
  en: 'English',
  es: 'Español',
};

// Context for locale state
const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
});

export const LocaleProvider = LocaleContext.Provider;

export const useLocale = () => useContext(LocaleContext);

/**
 * Extract locale from URL pathname
 * @param {string} pathname - URL pathname (e.g., '/es/s/listings')
 * @returns {string} - Locale code ('en' or 'es')
 */
export const getLocaleFromPath = pathname => {
  if (!pathname) return DEFAULT_LOCALE;

  // Match locale at the start of the path: /en/... or /es/...
  const localePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})(/|$)`);
  const match = pathname.match(localePattern);

  return match ? match[1] : DEFAULT_LOCALE;
};

/**
 * Check if a locale is supported
 * @param {string} locale - Locale code to check
 * @returns {boolean}
 */
export const isValidLocale = locale => {
  return SUPPORTED_LOCALES.includes(locale);
};

/**
 * Get browser's preferred locale
 * @returns {string} - Locale code
 */
export const getBrowserLocale = () => {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang?.split('-')[0];

  return isValidLocale(langCode) ? langCode : DEFAULT_LOCALE;
};

/**
 * Replace locale in a pathname
 * @param {string} pathname - Current pathname
 * @param {string} currentLocale - Current locale (may not actually be in path)
 * @param {string} newLocale - New locale to switch to
 * @returns {string} - New pathname with updated locale
 */
export const replaceLocaleInPath = (pathname, currentLocale, newLocale) => {
  if (!pathname || pathname === '/') return `/${newLocale}`;

  // Check if path actually has a locale prefix
  const anyLocalePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})(/|$)`);
  const match = pathname.match(anyLocalePattern);

  if (match) {
    // Path has a locale - replace it
    return pathname.replace(anyLocalePattern, `/${newLocale}$2`);
  }

  // No locale in path - prepend the new locale
  // Handle case where pathname might be just '/' or start with '/'
  if (pathname === '/') {
    return `/${newLocale}`;
  }

  return `/${newLocale}${pathname}`;
};

/**
 * Remove locale prefix from pathname
 * @param {string} pathname - Pathname with locale prefix
 * @returns {string} - Pathname without locale prefix
 */
export const removeLocaleFromPath = pathname => {
  if (!pathname) return '/';

  const localePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})(/|$)`);
  return pathname.replace(localePattern, '$2') || '/';
};

/**
 * Add locale prefix to pathname
 * @param {string} pathname - Pathname without locale prefix
 * @param {string} locale - Locale to add
 * @returns {string} - Pathname with locale prefix
 */
export const addLocaleToPath = (pathname, locale) => {
  if (!pathname) return `/${locale}`;

  // Don't add if already has locale
  const localePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})(/|$)`);
  if (localePattern.test(pathname)) {
    return pathname;
  }

  // Handle root path
  if (pathname === '/') {
    return `/${locale}`;
  }

  return `/${locale}${pathname}`;
};

/**
 * Get current locale from window location
 * @returns {string} - Current locale code
 */
const getCurrentLocale = () => {
  if (typeof window !== 'undefined') {
    return getLocaleFromPath(window.location.pathname) || DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
};

/**
 * Locale-aware pathByRouteName - automatically includes current locale
 * @param {string} name - Route name
 * @param {Array} routes - Route configuration
 * @param {Object} params - Path parameters (locale will be auto-injected if needed)
 * @returns {string} - Generated path with locale
 */
export const pathByRouteName = (name, routes, params = {}) => {
  const currentLocale = getCurrentLocale();

  // Check if route requires locale
  const route = routes?.find(r => r.name === name);
  const routeHasLocale = route?.path?.includes(':locale');

  const paramsWithLocale =
    routeHasLocale && !params?.locale ? { locale: currentLocale, ...params } : params;

  return originalPathByRouteName(name, routes, paramsWithLocale);
};

/**
 * Locale-aware createResourceLocatorString - automatically includes current locale
 * @param {string} name - Route name
 * @param {Array} routes - Route configuration
 * @param {Object} params - Path parameters (locale will be auto-injected if needed)
 * @param {Object} searchParams - Query string parameters
 * @returns {string} - Generated URL with locale
 */
export const createResourceLocatorString = (name, routes, params = {}, searchParams = {}) => {
  const currentLocale = getCurrentLocale();

  // Check if route requires locale
  const route = routes?.find(r => r.name === name);
  const routeHasLocale = route?.path?.includes(':locale');

  const paramsWithLocale =
    routeHasLocale && !params?.locale ? { locale: currentLocale, ...params } : params;

  return originalCreateResourceLocatorString(name, routes, paramsWithLocale, searchParams);
};
