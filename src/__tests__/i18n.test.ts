import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  translations,
  tLang,
  SupportedLanguage,
  applyLanguageToDom,
  loadLocale,
  loadedLocales,
} from '../i18n';

describe('Universal i18n Translation Engine', () => {
  const originalDoc = (globalThis as any).document;

  beforeAll(async () => {
    // Pre-load en and fr in tests
    await Promise.all([loadLocale('en'), loadLocale('fr')]);
  });

  beforeEach(() => {
    const attrs: Record<string, string> = {};
    (globalThis as any).document = {
      documentElement: {
        setAttribute: (k: string, v: string) => {
          attrs[k] = v;
        },
        getAttribute: (k: string) => attrs[k] || null,
        removeAttribute: (k: string) => {
          delete attrs[k];
        },
      },
    };
  });

  afterEach(() => {
    (globalThis as any).document = originalDoc;
  });

  it('should have translations dictionary defined for ar, en, and fr', () => {
    expect(translations.ar).toBeDefined();
    expect(translations.en).toBeDefined();
    expect(translations.fr).toBeDefined();
    expect(loadedLocales.ar).toBeDefined();
    expect(loadedLocales.en).toBeDefined();
    expect(loadedLocales.fr).toBeDefined();
  });

  it('should translate common keys correctly in Arabic, English, and French', () => {
    expect(tLang('ar', 'common.save')).toBe('حفظ');
    expect(tLang('en', 'common.save')).toBe('Save');
    expect(tLang('fr', 'common.save')).toBe('Enregistrer');
  });

  it('should translate navigation keys correctly', () => {
    expect(tLang('ar', 'nav.dashboard')).toBe('الرئيسية');
    expect(tLang('en', 'nav.dashboard')).toBe('Dashboard');
    expect(tLang('fr', 'nav.dashboard')).toBe('Tableau de Bord');
  });

  it('should translate Voice Studio keys across all 3 languages', () => {
    expect(tLang('ar', 'voiceStudio.title')).toBe('استوديو التسجيل والصوت الاحترافي 🎙️');
    expect(tLang('en', 'voiceStudio.title')).toBe('Voice & Recording Studio 🎙️');
    expect(tLang('fr', 'voiceStudio.title')).toBe('Studio Enregistrement & Voix 🎙️');
  });

  it('should translate Azkar Studio keys across all 3 languages', () => {
    expect(tLang('ar', 'azkarStudio.title')).toBe('استوديو الأذكار والحديث النبوي 📖');
    expect(tLang('en', 'azkarStudio.title')).toBe('Azkar & Hadith Studio 📖');
    expect(tLang('fr', 'azkarStudio.title')).toBe('Studio Azkar & Hadith 📖');
  });

  it('should translate 4K Image Quotes Studio keys across all 3 languages', () => {
    expect(tLang('ar', 'imageQuotes.title')).toBe('استوديو بطاقات الآيات 4K 🖼️');
    expect(tLang('en', 'imageQuotes.title')).toBe('4K Ayah Quotes Studio 🖼️');
    expect(tLang('fr', 'imageQuotes.title')).toBe('Studio Citations 4K 🖼️');
  });

  it('should translate Projects Management keys across all 3 languages', () => {
    expect(tLang('ar', 'projects.title')).toBe('مشاريعي المحفوظة 📂');
    expect(tLang('en', 'projects.title')).toBe('My Saved Projects 📂');
    expect(tLang('fr', 'projects.title')).toBe('Mes Projets Enregistrés 📂');
  });

  it('should translate export settings keys correctly', () => {
    expect(tLang('ar', 'export.title')).toBe('تصدير ونشر الفيديو 🎬');
    expect(tLang('en', 'export.title')).toBe('Export & Publish Video 🎬');
    expect(tLang('fr', 'export.title')).toBe('Exporter & Publier la Vidéo 🎬');
  });

  it('should translate Quick Text Floating Bar keys across all 3 languages', () => {
    expect(tLang('ar', 'quickText.badge')).toBe('تحرير النص');
    expect(tLang('en', 'quickText.badge')).toBe('Edit Text');
    expect(tLang('fr', 'quickText.badge')).toBe('Modifier le texte');

    expect(tLang('ar', 'quickText.decreaseFontSize')).toBe('تصغير حجم الخط (2px-)');
    expect(tLang('en', 'quickText.decreaseFontSize')).toBe('Decrease font size (-2px)');
    expect(tLang('fr', 'quickText.decreaseFontSize')).toBe('Réduire la taille (-2px)');

    expect(tLang('ar', 'quickText.increaseFontSize')).toBe('تكبير حجم الخط (2px+)');
    expect(tLang('en', 'quickText.increaseFontSize')).toBe('Increase font size (+2px)');
    expect(tLang('fr', 'quickText.increaseFontSize')).toBe('Augmenter la taille (+2px)');

    expect(tLang('ar', 'quickText.alignTop')).toBe('أعلى');
    expect(tLang('en', 'quickText.alignTop')).toBe('Top');
    expect(tLang('fr', 'quickText.alignTop')).toBe('Haut');
  });

  it('should fallback gracefully to fallback string or key if missing', () => {
    const res = tLang('en' as SupportedLanguage, 'non.existent.key', 'Default Fallback');
    expect(res).toBe('Default Fallback');
  });

  it('should fallback to Arabic if key is missing in target language', () => {
    const res = tLang('fr', 'common.save');
    expect(res).toBe('Enregistrer');
  });

  it('applyLanguageToDom should properly set lang and dir on documentElement', () => {
    applyLanguageToDom('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');

    applyLanguageToDom('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');

    applyLanguageToDom('fr');
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('should have consistent keys across ar, en, and fr dictionaries', () => {
    function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const k of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
          keys = keys.concat(getAllKeys(obj[k] as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const arKeys = getAllKeys(loadedLocales.ar as any).sort();
    const enKeys = getAllKeys(loadedLocales.en as any).sort();
    const frKeys = getAllKeys(loadedLocales.fr as any).sort();

    const missingInEn = arKeys.filter((k) => !enKeys.includes(k));
    const missingInFr = arKeys.filter((k) => !frKeys.includes(k));
    const extraInEn = enKeys.filter((k) => !arKeys.includes(k));
    const extraInFr = frKeys.filter((k) => !arKeys.includes(k));

    if (missingInEn.length > 0) {
      console.warn('[i18n Parity] Missing in EN:', missingInEn);
    }
    if (missingInFr.length > 0) {
      console.warn('[i18n Parity] Missing in FR:', missingInFr);
    }
    if (extraInEn.length > 0) {
      console.warn('[i18n Parity] Extra in EN:', extraInEn);
    }
    if (extraInFr.length > 0) {
      console.warn('[i18n Parity] Extra in FR:', extraInFr);
    }

    expect(missingInEn).toEqual([]);
    expect(missingInFr).toEqual([]);
    expect(extraInEn).toEqual([]);
    expect(extraInFr).toEqual([]);
  });
});
