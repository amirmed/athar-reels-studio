import { Project } from '../types';

export interface DailyReelTemplate {
  dayIndex: number; // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  dayName: string;
  title: string;
  subtitle: string;
  themeBadge: string;
  surahNumber: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  reciterId: string;
  reciterName: string;
  backgroundUrl: string;
  backgroundOpacity: number;
  textColor: string;
  fontFamily: string;
  wordHighlightColor: string;
  ambientSoundId?: string;
}

export const DAILY_REEL_SCHEDULE: DailyReelTemplate[] = [
  // 0: Sunday (الأحد) — الأمل وانشراح الصدر
  {
    dayIndex: 0,
    dayName: 'الأحد',
    title: 'بشرى الفرج وانشراح الصدر • سورة الضحى والشرح',
    subtitle: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَى • أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ',
    themeBadge: 'استفتاح الأسبوع ☀️',
    surahNumber: 93,
    surahName: 'الضحى',
    fromAyah: 1,
    toAyah: 11,
    reciterId: 'ghamdi_40',
    reciterName: 'سعد الغامدي',
    backgroundUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'dawn_birds',
  },

  // 1: Monday (الإثنين) — الرجاء وحسن الظن بالله
  {
    dayIndex: 1,
    dayName: 'الإثنين',
    title: 'رحمة ربك بعبده زكريا • سورة مريم',
    subtitle: 'إِذْ نَادَىٰ رَبَّهُ نِدَاءً خَفِيًّا • آيات حسن الظن بالله واليقين بالإجابة',
    themeBadge: 'رجاء ودعاء 🌿',
    surahNumber: 19,
    surahName: 'مريم',
    fromAyah: 1,
    toAyah: 9,
    reciterId: 'yasser_128',
    reciterName: 'ياسر الدوسري',
    backgroundUrl:
      'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.6,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#38bdf8',
    ambientSoundId: 'gentle_rain',
  },

  // 2: Tuesday (الثلاثاء) — نعم الله وتدبر خلقه
  {
    dayIndex: 2,
    dayName: 'الثلاثاء',
    title: 'عروس القرآن • سورة الرحمن',
    subtitle: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ مع مناظر الطبيعة والآلاء العظيمة',
    themeBadge: 'نعم وإحسان 🌸',
    surahNumber: 55,
    surahName: 'الرحمن',
    fromAyah: 1,
    toAyah: 13,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.6,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#34d399',
    ambientSoundId: 'ocean_waves',
  },

  // 3: Wednesday (الأربعاء) — نور الهداية والقرآن
  {
    dayIndex: 3,
    dayName: 'الأربعاء',
    title: 'مَثَلُ نُورِهِ • آية النور العظيمة',
    subtitle: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ بصوت خاشع مهيب يلامس القلوب',
    themeBadge: 'نور وهداية ✨',
    surahNumber: 24,
    surahName: 'النور',
    fromAyah: 35,
    toAyah: 35,
    reciterId: 'abdulbasit_murat_192',
    reciterName: 'عبد الباسط عبد الصمد',
    backgroundUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'desert_wind',
  },

  // 4: Thursday (الخميس) — سكون الليل والمنجية
  {
    dayIndex: 4,
    dayName: 'الخميس',
    title: 'المنجية من عذاب القبر • سورة الملك',
    subtitle: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ في سكون ليلة الجمعة المباركة',
    themeBadge: 'سكينة المساء 🌙',
    surahNumber: 67,
    surahName: 'الملك',
    fromAyah: 1,
    toAyah: 8,
    reciterId: 'maher_128',
    reciterName: 'ماهر المعيقلي',
    backgroundUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.6,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'gentle_rain',
  },

  // 5: Friday (الجمعة) — سنة الجمعة وقراءة الكهف
  {
    dayIndex: 5,
    dayName: 'الجمعة',
    title: 'نور بين الجمعتين • سورة الكهف',
    subtitle: 'أوائل سورة الكهف بالصوت العذب والخاشع لنيل نور يوم الجمعة',
    themeBadge: 'جمعة مباركة 🕊️',
    surahNumber: 18,
    surahName: 'الكهف',
    fromAyah: 1,
    toAyah: 10,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    backgroundUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'gentle_rain',
  },

  // 6: Saturday (السبت) — سعة رحمة الله والمغفرة
  {
    dayIndex: 6,
    dayName: 'السبت',
    title: 'لا تقنطوا من رحمة الله • سورة الزمر',
    subtitle:
      'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    themeBadge: 'مغفرة ورحمة 🤍',
    surahNumber: 39,
    surahName: 'الزمر',
    fromAyah: 53,
    toAyah: 54,
    reciterId: 'idrees_128',
    reciterName: 'إدريس أبكر',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    backgroundOpacity: 0.65,
    textColor: '#ffffff',
    fontFamily: 'Amiri',
    wordHighlightColor: '#34d399',
    ambientSoundId: 'forest_stream',
  },
];

/**
 * Get Today's Curated Daily Reel Template strictly based on current day of week (0 to 6)
 */
export function getTodayReelTemplate(): DailyReelTemplate {
  const day = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  return DAILY_REEL_SCHEDULE.find((s) => s.dayIndex === day) || DAILY_REEL_SCHEDULE[0];
}

/**
 * Instantiate a Project object from today's daily reel template
 */
export function buildTodayDailyReelProject(): Project {
  const tpl = getTodayReelTemplate();
  const dateStr = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return {
    id: `daily-reel-${Date.now()}`,
    name: `ريلز يوم ${tpl.dayName} • ${tpl.title}`,
    reciter: tpl.reciterName,
    reciterId: tpl.reciterId,
    surah: tpl.surahName,
    surahNumber: tpl.surahNumber,
    fromAyah: tpl.fromAyah,
    toAyah: tpl.toAyah,
    aspectRatio: '9:16',
    backgroundType: 'image',
    backgroundUrl: tpl.backgroundUrl,
    backgroundOpacity: tpl.backgroundOpacity,
    watermark: 'atar-studio.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    audioSettings: {
      recitationVolume: 88,
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 1.5,
      backgroundVolume: 25,
      ambientSoundId: tpl.ambientSoundId || 'gentle_rain',
      ambientSoundVolume: 28,
    },
    textSettings: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      textColor: tpl.textColor,
      bgColor: '#000000',
      bgOpacity: 0.45,
      position: 'center',
      translationFontSize: 13,
      translationColor: '#e2e8f0',
      translationLanguage: 'en',
      fontFamily: tpl.fontFamily,
      displayMode: 'chunked', // Default to Smart Waqf-aware Chunking!
      wordHighlightEnabled: true,
      wordHighlightStyle: 'goldGlow',
      wordHighlightColor: tpl.wordHighlightColor,
      showWaveform: true,
      waveformStyle: 'bars',
      waveformColor: '#fbbf24',
    },
    status: 'editing',
    exportCount: 0,
    translationEnabled: false,
    tafsirEnabled: false,
  };
}
