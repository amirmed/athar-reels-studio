/**
 * Athar Studio Universal i18n Translation Engine
 * Modular locale management with on-demand lazy loading for English & French,
 * and zero-latency instant bundling for Arabic.
 */

import { SupportedLanguage, TranslationDictionary } from './types';
import arTranslations from './locales/ar';

export type { SupportedLanguage, TranslationDictionary };

// In-memory cache of loaded dictionaries (Arabic is pre-bundled as default base)
export const loadedLocales: Record<SupportedLanguage, TranslationDictionary | null> = {
  ar: arTranslations,
  en: null,
  fr: null,
};

// Dynamic chunk loaders for optional locales
const localeLoaders: Record<SupportedLanguage, () => Promise<{ default: TranslationDictionary }>> = {
  ar: async () => ({ default: arTranslations }),
  en: () => import('./locales/en'),
  fr: () => import('./locales/fr'),
};

type LocaleChangeListener = (lang: SupportedLanguage, dict: TranslationDictionary) => void;
const listeners = new Set<LocaleChangeListener>();

export function subscribeLocaleChange(listener: LocaleChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Loads a language dictionary asynchronously on-demand
 */
export async function loadLocale(lang: SupportedLanguage): Promise<TranslationDictionary> {
  if (loadedLocales[lang]) {
    return loadedLocales[lang]!;
  }
  const loader = localeLoaders[lang];
  if (!loader) {
    return arTranslations;
  }

  try {
    const mod = await loader();
    loadedLocales[lang] = mod.default;
    listeners.forEach((fn) => {
      try {
        fn(lang, mod.default);
      } catch (err) {
        console.debug('[i18n] listener notification error:', err);
      }
    });
    return mod.default;
  } catch (err) {
    console.warn(`[i18n] Failed to load locale "${lang}", falling back to Arabic:`, err);
    return arTranslations;
  }
}

/**
 * Backwards-compatible translations proxy object
 */
export const translations: Record<SupportedLanguage, TranslationDictionary> = new Proxy(
  {} as Record<SupportedLanguage, TranslationDictionary>,
  {
    get(_target, prop: string) {
      const lang = prop as SupportedLanguage;
      return loadedLocales[lang] || arTranslations;
    },
    has(_target, prop: string) {
      return prop === 'ar' || prop === 'en' || prop === 'fr';
    },
  }
);
