import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  translations,
  SupportedLanguage,
  loadedLocales,
  loadLocale,
  subscribeLocaleChange,
} from './translations';

export type TranslationKey = string;

/**
 * Helper to retrieve nested keys from translations dictionary
 * e.g. getNestedValue(translations.ar, 'nav.dashboard')
 */
function getNestedValue(obj: Record<string, unknown> | unknown, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Pure translation lookup function (usable in non-React files)
 */
export function tLang(lang: SupportedLanguage = 'ar', key: string, fallback?: string): string {
  const dict = loadedLocales[lang] || loadedLocales.ar || translations.ar;
  const val = getNestedValue(dict, key);
  if (val !== undefined) return val;

  // Fallback to Arabic if missing in target language
  const arVal = getNestedValue(loadedLocales.ar || translations.ar, key);
  if (arVal !== undefined) return arVal;

  return fallback || key;
}

/**
 * Applies language and direction attributes to document root element
 */
export function applyLanguageToDom(lang: SupportedLanguage = 'ar') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

/**
 * React Hook for type-safe, reactive i18n translation
 * Automatically lazy-loads target locale if needed and triggers re-render.
 */
export function useTranslation() {
  const language = useAppStore((s) => s.settings.language || 'ar') as SupportedLanguage;
  const [, setTick] = useState(0);

  useEffect(() => {
    // If target language is not loaded yet, fetch it asynchronously
    if (!loadedLocales[language]) {
      loadLocale(language).then(() => {
        setTick((t) => t + 1);
      });
    }

    // Subscribe to any locale load completion
    return subscribeLocaleChange((changedLang) => {
      if (changedLang === language) {
        setTick((t) => t + 1);
      }
    });
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return tLang(language, key, fallback);
  };

  const isRTL = language === 'ar';

  return {
    t,
    language,
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',
    loadLocale,
  };
}

export * from './translations';
export * from './types';
