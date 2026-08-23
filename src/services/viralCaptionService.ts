import { Project } from '../types';
import { AyahData } from './quranApi';

export type CaptionTone = 'spiritual' | 'engagement' | 'reflection' | 'bilingual';

export interface HashtagTier {
  category: 'broad' | 'niche' | 'targeted' | 'golden';
  title: string;
  badge: string;
  icon: string;
  tags: string[];
}

export interface ViralCaptionOptions {
  surahName?: string;
  ayahRange?: string;
  ayahText?: string;
  translationText?: string;
  customTitle?: string;
  reciterName?: string;
  tone?: CaptionTone;
  dedicateToParents?: boolean;
  customParentName?: string;
}

export interface ViralCaptionResult {
  title: string;
  hook: string;
  body: string;
  callToAction: string;
  fullCaption: string;
  hashtags: string[];
  hashtagsText: string;
  surahName: string;
  reciterName: string;
  verseRange: string;
  broadHashtags: string[];
  nicheHashtags: string[];
  targetedHashtags: string[];
  goldenHashtags: string[];
  hashtagTiers: HashtagTier[];
}

const VIRAL_HOOKS = [
  'تلاوة خاشعة تلامس شغاف القلوب وتريح البال 🌿✨',
  'آيات تشرح الصدور وتزيل الهموم والأحزان 🤍🌧️',
  'استمع بقلبك.. راحة نفسية وطمأنينة لا توصف 🕊️📖',
  'تلاوة تأخذك إلى عالم آخر من السكينة والخشوع 🌌🕋',
  'آيات عظيمة تدعو للتفكر والتدبر في ملكوت الله 👑✨',
  'تلاوة مباركة تضيء عتمة القلب وتملأه نوراً 🌸💫',
  'دقيقة واحدة من راحة البال وطمأنينة الروح 🌿🤲',
];

/**
 * Universal Viral Caption Generator (Supports both Project object and Options config)
 */
export function generateViralCaption(
  projectOrOptions: Project | ViralCaptionOptions,
  ayahs?: AyahData[],
  translationTextParam?: string
): ViralCaptionResult {
  let surahName = 'سورة الفاتحة';
  let reciterName = 'مشاري العفاسي';
  let verseRange = '1 - 7';
  let ayahText = '';
  let translationText = '';
  let customTitle = '';
  let tone: CaptionTone = 'spiritual';
  let dedicateToParents = false;
  let customParentName = '';

  // Check if first argument is a Project instance
  if ('name' in projectOrOptions && 'createdAt' in projectOrOptions) {
    const p = projectOrOptions as Project;
    surahName = p.surah || 'القرآن الكريم';
    reciterName = p.reciter || 'القارئ';
    const fromAyah = p.fromAyah || 1;
    const toAyah = p.toAyah || fromAyah;
    verseRange = fromAyah === toAyah ? `الآية (${fromAyah})` : `الآيات (${fromAyah} - ${toAyah})`;
    customTitle = p.customTitle || p.name;
    translationText = translationTextParam || '';

    if (ayahs && ayahs.length > 0) {
      ayahText = ayahs.map((a) => `${a.text} ﴿${a.numberInSurah}﴾`).join('\n');
    } else {
      ayahText = `سورة ${surahName} [${verseRange}]`;
    }
  } else {
    // Options object
    const opt = projectOrOptions as ViralCaptionOptions;
    surahName = opt.surahName || 'سورة من القرآن الكريم';
    reciterName = opt.reciterName || 'القارئ';
    verseRange = opt.ayahRange || '1 - 7';
    ayahText = opt.ayahText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
    translationText = opt.translationText || '';
    customTitle = opt.customTitle || '';
    tone = opt.tone || 'spiritual';
    dedicateToParents = opt.dedicateToParents ?? false;
    customParentName = opt.customParentName || '';
  }

  const cleanSurahTag = `#سورة_${surahName.replace(/\s+/g, '_')}`;
  const cleanReciterTag = `#${reciterName.replace(/\s+/g, '_')}`;

  const broadHashtags = ['#قرآن', '#تلاوة_خاشعة', '#quran', '#viral', '#reels', '#explore'];
  const nicheHashtags = [
    cleanSurahTag,
    '#راحة_نفسية',
    '#سكينة_وطمأنينة',
    '#تدبر_القرآن',
    '#آيات_قرآنية',
    '#quranic',
  ];
  const targetedHashtags = [
    cleanReciterTag,
    '#quranrecitation',
    '#اكسبلور_explore',
    '#foryou_page',
    '#atar_studio',
  ];
  const goldenHashtags = [
    '#قرآن',
    cleanSurahTag,
    cleanReciterTag,
    '#تلاوة_خاشعة',
    '#راحة_نفسية',
    '#quran',
    '#viral',
  ];

  const allHashtags = [
    cleanSurahTag,
    cleanReciterTag,
    '#قرآن',
    '#تلاوة_خاشعة',
    '#راحة_نفسية',
    '#سكينة_وطمأنينة',
    '#quran',
    '#quranrecitation',
    '#viral',
    '#reels',
    '#explore',
    '#atar_studio',
  ];
  const hashtagsText = goldenHashtags.join(' ');

  const hashtagTiers: HashtagTier[] = [
    {
      category: 'golden',
      title: 'الحزمة الذهبية للخوارزميات 2026 (7 هاشتاجات مثالية)',
      badge: 'الأعلى كفاءة 💎',
      icon: '💎',
      tags: goldenHashtags,
    },
    {
      category: 'broad',
      title: 'هاشتاجات كبرى عالية الانتشار (Broad Reach)',
      badge: 'مليونية 🚀',
      icon: '🚀',
      tags: broadHashtags,
    },
    {
      category: 'niche',
      title: 'هاشتاجات متخصصة في السورة والسكينة (Niche & Topic)',
      badge: 'استهداف دقيق 🎯',
      icon: '🎯',
      tags: nicheHashtags,
    },
    {
      category: 'targeted',
      title: 'هاشتاجات القارئ والتريند (Targeted Reciter)',
      badge: 'تريند 📈',
      icon: '📈',
      tags: targetedHashtags,
    },
  ];

  let hook = '🌿 ضع سماعتك، واستمع بقلبك لدقيقة من السكينة.. ✨';
  let body = `« ${ayahText} »\n\n📖 المصدر: ${customTitle || `سورة ${surahName} (${verseRange})`}`;
  let callToAction =
    'اللهم اجعل القرآن العظيم ربيع قلوبنا ونور صدورنا 🤍\n📌 احفظ المقطع عندك لترجع إليه في أوقات ضيقك، وشاركه لتنال أجره.';

  if (tone === 'engagement') {
    hook = '✨ آية عظيمة إذا استشعرتها زال كل هم في قلبك.. 🤍';
    body = `« ${ayahText} »\n\n📖 سورة ${surahName} [${verseRange}]`;
    callToAction =
      'اكتب في التعليقات (سبحان الله وبحمده) لتؤجر عليها في هذا اليوم المبارك 🤲\nدالّ على الخير كفاعله 🚀';
  } else if (tone === 'reflection') {
    hook = '💡 وقفة تدبر.. كيف تواجه عواصف الحياة بهذا المعنى القرآني؟ 🌧️';
    body = `« ${ayahText} »\n\nتأمل عظمة هذا الخطاب الإلهي وكيف يرتب فوضى مشاعرك ويمنحك الطمأنينة الكاملة.\n📖 سورة ${surahName}`;
    callToAction = 'ما هي أكثر آية تشعرك بالسكينة عندما تسمعها؟ شاركنا في التعليقات 👇';
  } else if (tone === 'bilingual') {
    hook = '🎧 Soul Healing Recitation • تلاوة تريح النفوس 🤍';
    body = `« ${ayahText} »\n\n📖 Surah ${surahName} [${verseRange}]`;
    if (translationText) {
      body += `\n💬 Translation: "${translationText}"`;
    }
    callToAction =
      'May Allah fill your heart with peace and guidance. Share for continuous reward ✨🤲';
  } else {
    // Default spiritual
    if (translationText) {
      body += `\n💬 المعنى: "${translationText}"`;
    }
  }

  // Parent Dedication text if requested
  let parentDedication = '';
  if (dedicateToParents) {
    const pName = customParentName.trim();
    if (pName) {
      parentDedication = `\n🤍 صدقة جارية ودعاء خالص لـ «${pName}» — اللهم اغفر له/لها وارحمها واجعل الفردوس الأعلى مستقرها 🤲🌸\n`;
    } else {
      parentDedication = `\n🤍 رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا 🤲🌸 • هذا المقطع صدقة جارية لكل والدين\n`;
    }
  }

  let fullCaption = `${hook}\n\n`;
  fullCaption += `📖 سورة: ${surahName} — ${verseRange}\n`;
  fullCaption += `🎙️ القارئ: ${reciterName}\n\n`;
  fullCaption += `${body}\n\n`;
  fullCaption += `${callToAction}\n`;
  if (parentDedication) {
    fullCaption += `${parentDedication}\n`;
  } else {
    fullCaption += `\n🤲 صدقة جارية عن الوالدة تيجاني عائشة رحمها الله ولكل والدين\n`;
  }
  fullCaption += `🌐 صُنِع عبر: atar-studio.com\n\n`;
  fullCaption += `${hashtagsText}`;

  return {
    title: `${hook.slice(0, 40)} • سورة ${surahName}`,
    hook,
    body,
    callToAction,
    fullCaption,
    hashtags: allHashtags,
    hashtagsText,
    surahName,
    reciterName,
    verseRange,
    broadHashtags,
    nicheHashtags,
    targetedHashtags,
    goldenHashtags,
    hashtagTiers,
  };
}

/**
 * Helper to safely encode text without throwing URIError on malformed surrogate pairs
 */
function safeEncode(text: string): string {
  try {
    return encodeURIComponent(text);
  } catch {
    try {
      // Clean any lone surrogate halves if present
      const sanitized = text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
      return encodeURIComponent(sanitized);
    } catch {
      return encodeURI(text);
    }
  }
}

/**
 * Generate Direct Social Share URLs
 */
export function getSocialShareLinks(
  caption: string = '',
  projectUrl: string = 'https://atar-studio.com'
) {
  const safeCaption = caption || '';
  // Safe Unicode-aware slicing using Array.from to prevent splitting UTF-16 surrogate pairs (e.g. emojis 🔥✨)
  const sliced240 = Array.from(safeCaption).slice(0, 240).join('');

  const encodedText = safeEncode(safeCaption);
  const encodedSliced = safeEncode(sliced240);
  const encodedUrl = safeEncode(projectUrl);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    x: `https://twitter.com/intent/tweet?text=${encodedSliced}&url=${encodedUrl}`,
  };
}

/**
 * Trigger Native Device Share Sheet (Mobile / Modern Desktops)
 */
export async function triggerNativeShare(
  title: string,
  text: string,
  url: string = 'https://atar-studio.com'
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Native share error:', err);
      }
      return false;
    }
  }
  return false;
}
