import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { translations, tLang, SupportedLanguage, applyLanguageToDom } from '../i18n';

describe('Universal i18n Translation Engine', () => {
  const originalDoc = (globalThis as any).document;

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
});
