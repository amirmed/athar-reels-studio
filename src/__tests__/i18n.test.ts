import { describe, it, expect } from 'vitest';
import { translations, tLang, SupportedLanguage } from '../i18n';

describe('Universal i18n Translation Engine', () => {
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
});
