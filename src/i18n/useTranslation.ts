import { useAppStore } from '../store/useAppStore';
import { translations, SupportedLanguage } from './translations';

export type TranslationKey = string;

/**
 * Helper to retrieve nested keys from translations dictionary
 * e.g. getNested(translations.ar, 'nav.dashboard')
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
  const dict = translations[lang] || translations.ar;
  const val = getNestedValue(dict, key);
  if (val !== undefined) return val;

  // Fallback to Arabic if missing in target language
  const arVal = getNestedValue(translations.ar, key);
  if (arVal !== undefined) return arVal;

  return fallback || key;
}

/**
 * React Hook for type-safe, reactive i18n translation
 */
export function useTranslation() {
  const language = useAppStore((s) => s.settings.language || 'ar') as SupportedLanguage;

  const t = (key: string, fallback?: string): string => {
    return tLang(language, key, fallback);
  };

  const isRTL = language === 'ar';

  return {
    t,
    language,
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',
  };
}

export * from './translations';
