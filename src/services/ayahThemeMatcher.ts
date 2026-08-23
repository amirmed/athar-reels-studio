/**
 * Smart Quranic Semantic Ayah Theme & Background Matcher
 * Analyzes Ayah text keywords to automatically suggest & apply the most fitting aesthetic background.
 */

export interface AyahThemeMatch {
  themeId: string;
  themeName: string;
  themeIcon: string;
  reason: string;
  recommendedBackgroundUrl: string;
  recommendedVideoUrl?: string;
  suggestedColorGrading: 'royalGold' | 'andalusianTwilight' | 'emeraldNoor';
  alternativeBackgrounds: string[];
}

interface ThemeRule {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  backgrounds: string[];
  videoUrl?: string;
  colorGrading: 'royalGold' | 'andalusianTwilight' | 'emeraldNoor';
}

const THEME_RULES: ThemeRule[] = [
  {
    id: 'kaaba_masjid',
    name: 'الحرم المكي والبيوت المعظمة',
    icon: '🕋',
    keywords: [
      'كعبة',
      'مسجد',
      'حرم',
      'بيت',
      'قبلة',
      'مكة',
      'طواف',
      'صفا',
      'مروة',
      'صلاة',
      'سجد',
      'ركع',
      'مقام',
      'حج',
      'عمرة',
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-people-walking-around-the-kaaba-in-mecca-44331-large.mp4',
    backgrounds: [
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ],
    colorGrading: 'royalGold',
  },
  {
    id: 'jannah_nature',
    name: 'الجنة والأنهار والنعيم',
    icon: '🌿',
    keywords: [
      'جنة',
      'جنات',
      'أنهار',
      'شجر',
      'ثمر',
      'نعيم',
      'ريحان',
      'سندس',
      'استبرق',
      'عين',
      'عيون',
      'فردوس',
      'روضة',
      'خضراء',
      'نبات',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
    backgrounds: [
      'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1420440/pexels-photo-1420440.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/158607/cairn-fog-mystical-background-158607.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ],
    colorGrading: 'emeraldNoor',
  },
  {
    id: 'ocean_water_rain',
    name: 'البحار والأمطار والسكينة',
    icon: '🌊',
    keywords: [
      'بحر',
      'بحار',
      'ماء',
      'غيث',
      'مطر',
      'سحاب',
      'مزن',
      'ودق',
      'فلك',
      'سفينة',
      'موج',
      'أمواج',
      'مرجان',
      'لؤلؤ',
      'نهر',
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-1528-large.mp4',
    backgrounds: [
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ],
    colorGrading: 'andalusianTwilight',
  },
  {
    id: 'sky_cosmos_night',
    name: 'السماء والكون والنجوم',
    icon: '🌌',
    keywords: [
      'سماء',
      'سموات',
      'نجوم',
      'شمس',
      'قمر',
      'كواكب',
      'بروج',
      'فلك',
      'ليل',
      'ضحى',
      'صبح',
      'فجر',
      'طارق',
      'أفق',
      'عرش',
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-timelapse-42436-large.mp4',
    backgrounds: [
      'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ],
    colorGrading: 'andalusianTwilight',
  },
  {
    id: 'mountains_earth',
    name: 'الجبال والرواسي والأرض',
    icon: '🏔️',
    keywords: [
      'جبل',
      'جبال',
      'رواسي',
      'أرض',
      'طور',
      'وادي',
      'صخر',
      'فجاج',
      'سبل',
      'عظيم',
      'قدرة',
      'خلق',
    ],
    videoUrl:
      'https://assets.mixkit.co/videos/preview/mixkit-sand-dunes-in-a-desert-during-sunset-42848-large.mp4',
    backgrounds: [
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ],
    colorGrading: 'royalGold',
  },
  {
    id: 'noor_spiritual_light',
    name: 'النور والهدى والروحانية',
    icon: '✨',
    keywords: [
      'نور',
      'هدى',
      'كتاب',
      'قرآن',
      'ذكر',
      'حكمة',
      'إيمان',
      'حق',
      'صراط',
      'مستقيم',
      'رحمة',
      'سكينة',
      'سلام',
      'توبة',
      'مغفرة',
    ],
    backgrounds: [
      'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/3374210/pexels-photo-3374210.jpeg?auto=compress&cs=tinysrgb&w=1280',
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ],
    colorGrading: 'royalGold',
  },
];

import { removeTashkeel } from '../utils/arabicTextUtils';

/**
 * Analyzes the text of an Ayah and returns the best matching theme and wallpapers
 */
export function matchAyahTheme(ayahText: string): AyahThemeMatch {
  if (!ayahText) {
    const defaultRule = THEME_RULES[0];
    return {
      themeId: defaultRule.id,
      themeName: defaultRule.name,
      themeIcon: defaultRule.icon,
      reason: 'خلفية إسلامية عامة متناسقة',
      recommendedBackgroundUrl: defaultRule.backgrounds[0],
      recommendedVideoUrl: defaultRule.videoUrl,
      suggestedColorGrading: defaultRule.colorGrading,
      alternativeBackgrounds: defaultRule.backgrounds,
    };
  }

  const cleanText = removeTashkeel(ayahText);
  let bestRule: ThemeRule = THEME_RULES[5]; // Default: Noor & Spiritual
  let maxMatches = 0;
  let matchedKeyword = '';

  for (const rule of THEME_RULES) {
    let count = 0;
    for (const kw of rule.keywords) {
      if (cleanText.includes(kw)) {
        count += 2;
        if (!matchedKeyword) matchedKeyword = kw;
      }
    }
    if (count > maxMatches) {
      maxMatches = count;
      bestRule = rule;
    }
  }

  return {
    themeId: bestRule.id,
    themeName: bestRule.name,
    themeIcon: bestRule.icon,
    reason: matchedKeyword
      ? `تمت المطابقة بناءً على سياق («${matchedKeyword}»)`
      : 'أجواء إيمانية روحانية',
    recommendedBackgroundUrl: bestRule.backgrounds[0],
    recommendedVideoUrl: bestRule.videoUrl,
    suggestedColorGrading: bestRule.colorGrading,
    alternativeBackgrounds: bestRule.backgrounds,
  };
}
