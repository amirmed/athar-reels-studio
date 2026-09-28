export interface TranslationEdition {
  id: string;
  nameAr: string;
  nameEn: string;
  langCode: string;
}

export const TRANSLATION_EDITIONS: Record<string, TranslationEdition> = {
  en: {
    id: 'en.sahih',
    nameAr: 'الإنجليزية (صحيح إنترناشونال)',
    nameEn: 'English (Saheeh Int.)',
    langCode: 'en',
  },
  fr: {
    id: 'fr.hamidullah',
    nameAr: 'الفرنسية (محمد حميد الله)',
    nameEn: 'Français (Hamidullah)',
    langCode: 'fr',
  },
  ur: {
    id: 'ur.jalandhry',
    nameAr: 'الأردية (فتح محمد جالندري)',
    nameEn: 'Urdu (Jalandhry)',
    langCode: 'ur',
  },
  tr: {
    id: 'tr.ates',
    nameAr: 'التركية (سليمان أتش)',
    nameEn: 'Türkçe (Süleyman Ateş)',
    langCode: 'tr',
  },
  es: {
    id: 'es.cortes',
    nameAr: 'الإسبانية (خوليو كورتيس)',
    nameEn: 'Español (Julio Cortés)',
    langCode: 'es',
  },
  id: {
    id: 'id.indonesian',
    nameAr: 'الإندونيسية (وزارة الشؤون)',
    nameEn: 'Indonesian',
    langCode: 'id',
  },
};
