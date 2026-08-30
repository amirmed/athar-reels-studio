/**
 * Athar Studio Universal i18n Types
 */

export type SupportedLanguage = 'ar' | 'en' | 'fr';

export type TranslationDictionary = {
  appName: string;
  appSubtitle: string;
  appDescription: string;
  nav: Record<string, string>;
  common: Record<string, string>;
  dashboard: Record<string, string>;
  editor: Record<string, string>;
  voiceStudio: Record<string, string>;
  azkarStudio: Record<string, string>;
  imageQuotes: Record<string, string>;
  projects: Record<string, string>;
  export: Record<string, string>;
  settings: Record<string, string>;
  shortcutsModal?: Record<string, string>;
  islamicEventsModal?: Record<string, string>;
  globalSearchModal?: Record<string, string>;
  [key: string]: unknown;
};

export type LocaleLoader = () => Promise<{ default: TranslationDictionary }>;
