import { ColorGradingFilter } from '../types';

export type MoodCategory = 'peace' | 'healing' | 'night' | 'endings';

export interface MoodCategoryMeta {
  id: MoodCategory;
  name: string;
  englishName: string;
  icon: string;
  badge: string;
  description: string;
  accentColor: string;
}

export const MOOD_CATEGORIES: MoodCategoryMeta[] = [
  {
    id: 'peace',
    name: 'آيات السكينة وراحة البال',
    englishName: 'Peace & Serenity',
    icon: '🌿',
    badge: 'سكينة وطمأنينة',
    description: 'آيات تشرح الصدور وتزيل القلق والاضطراب وتملأ القلب أمناً ورضى',
    accentColor: '#34d399',
  },
  {
    id: 'healing',
    name: 'آيات الشفاء وتفريج الكرب',
    englishName: 'Healing & Relief',
    icon: '🤲',
    badge: 'شفاء وفرج',
    description: 'أدعية الأنبياء وآيات الاستشفاء والفرج بعد الشدة وتيسير الأمور',
    accentColor: '#38bdf8',
  },
  {
    id: 'night',
    name: 'آيات سكون الليل والخشوع',
    englishName: 'Night Reflection',
    icon: '🌙',
    badge: 'خشوع الليل',
    description: 'تلاوات خاشعة مهيبة في سكون الليل والتفكر في ملكوت السماوات والأرض',
    accentColor: '#fbbf24',
  },
  {
    id: 'endings',
    name: 'خواتيم السور العظيمة',
    englishName: 'Grand Surah Endings',
    icon: '🕊️',
    badge: 'خواتيم مباركة',
    description: 'أعظم خواتيم السور القرآنية الحافلة بالأجر والفضائل النبوية الثابتة',
    accentColor: '#c084fc',
  },
];

export interface QuranPlaylistItem {
  id: string;
  category: MoodCategory;
  title: string;
  subtitle: string;
  surahNumber: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  reciterId: string;
  reciterName: string;
  themeBadge: string;
  backgroundUrl: string;
  colorGrading: ColorGradingFilter;
  wordHighlightColor: string;
  ambientSoundId: string;
}

export const QURAN_PLAYLISTS: QuranPlaylistItem[] = [
  // ==================== 1. PEACE & SERENITY (السكينة وراحة البال) ====================
  {
    id: 'peace_rad_28',
    category: 'peace',
    title: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    subtitle: 'سورة الرعد • الآية 28 • راحة نفسية عميقة',
    surahNumber: 13,
    surahName: 'الرعد',
    fromAyah: 28,
    toAyah: 29,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    themeBadge: 'سكينة القلب 🌿',
    backgroundUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'dawnMist',
    wordHighlightColor: '#34d399',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'peace_fath_4',
    category: 'peace',
    title: 'هُوَ الَّذِي أَنْزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ',
    subtitle: 'سورة الفتح • الآية 4 • نزول الطمأنينة والأمن',
    surahNumber: 48,
    surahName: 'الفتح',
    fromAyah: 4,
    toAyah: 5,
    reciterId: 'yasser_128',
    reciterName: 'ياسر الدوسري',
    themeBadge: 'أمن وإيمان 🕊️',
    backgroundUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'royalGold',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'dawn_birds',
  },
  {
    id: 'peace_younus_62',
    category: 'peace',
    title: 'أَلَا إِنَّ أَوْلِيَاءَ اللَّهِ لَا خَوْفٌ عَلَيْهِمْ',
    subtitle: 'سورة يونس • الآيات 62 - 64 • بشرى لا خوف ولا حزن',
    surahNumber: 10,
    surahName: 'يونس',
    fromAyah: 62,
    toAyah: 64,
    reciterId: 'maher_128',
    reciterName: 'ماهر المعيقلي',
    themeBadge: 'أولياء الله ✨',
    backgroundUrl:
      'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'emeraldNoor',
    wordHighlightColor: '#38bdf8',
    ambientSoundId: 'ocean_waves',
  },

  // ==================== 2. HEALING & RELIEF (الشفاء وتفريج الكرب) ====================
  {
    id: 'heal_anbiya_83',
    category: 'healing',
    title: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنْتَ أَرْحَمُ الرَّاحِمِينَ',
    subtitle: 'سورة الأنبياء • دعاء نبي الله أيوب عليه السلام',
    surahNumber: 21,
    surahName: 'الأنبياء',
    fromAyah: 83,
    toAyah: 84,
    reciterId: 'idrees_128',
    reciterName: 'إدريس أبكر',
    themeBadge: 'دعاء الشفاء 🤲',
    backgroundUrl:
      'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'dawnMist',
    wordHighlightColor: '#38bdf8',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'heal_sharh_1',
    category: 'healing',
    title: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ • فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    subtitle: 'سورة الشرح كاملة • انشراح الصدر واليسر بعد العسر',
    surahNumber: 94,
    surahName: 'الشرح',
    fromAyah: 1,
    toAyah: 8,
    reciterId: 'ghamdi_40',
    reciterName: 'سعد الغامدي',
    themeBadge: 'انشراح الصدر ☀️',
    backgroundUrl:
      'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'royalGold',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'dawn_birds',
  },
  {
    id: 'heal_israa_82',
    category: 'healing',
    title: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ',
    subtitle: 'سورة الإسراء • الآية 82 • بركة الاستشفاء بالقرآن',
    surahNumber: 17,
    surahName: 'الإسراء',
    fromAyah: 82,
    toAyah: 82,
    reciterId: 'abdulbasit_murat_192',
    reciterName: 'عبد الباسط عبد الصمد',
    themeBadge: 'شفاء ورحمة 🤍',
    backgroundUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'emeraldNoor',
    wordHighlightColor: '#34d399',
    ambientSoundId: 'desert_wind',
  },

  // ==================== 3. NIGHT REFLECTION (سكون الليل والخشوع) ====================
  {
    id: 'night_mulk_1',
    category: 'night',
    title: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ • المنجية',
    subtitle: 'سورة الملك • الآيات 1 - 5 • سكون الليل والنجاة',
    surahNumber: 67,
    surahName: 'الملك',
    fromAyah: 1,
    toAyah: 5,
    reciterId: 'maher_128',
    reciterName: 'ماهر المعيقلي',
    themeBadge: 'سكينة المساء 🌙',
    backgroundUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'andalusianTwilight',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'night_sajdah_15',
    category: 'night',
    title: 'إِنَّمَا يُؤْمِنُ بِآيَاتِنَا الَّذِينَ إِذَا ذُكِّرُوا بِهَا خَرُّوا سُجَّدًا',
    subtitle: 'سورة السجدة • الآيات 15 - 17 • تتجافى جنوبهم عن المضاجع',
    surahNumber: 32,
    surahName: 'السجدة',
    fromAyah: 15,
    toAyah: 17,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    themeBadge: 'قيام وخشوع 🌌',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'andalusianTwilight',
    wordHighlightColor: '#38bdf8',
    ambientSoundId: 'desert_wind',
  },
  {
    id: 'night_qaf_16',
    category: 'night',
    title: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
    subtitle: 'سورة ق • الآيات 16 - 19 • مراقبة الله وعظمته',
    surahNumber: 50,
    surahName: 'ق',
    fromAyah: 16,
    toAyah: 19,
    reciterId: 'yasser_128',
    reciterName: 'ياسر الدوسري',
    themeBadge: 'قرب ومراقبة 👑',
    backgroundUrl:
      'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'matteSilver',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'ocean_waves',
  },

  // ==================== 4. GRAND SURAH ENDINGS (خواتيم السور العظيمة) ====================
  {
    id: 'end_baqarah_285',
    category: 'endings',
    title: 'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ • خواتيم البقرة',
    subtitle: 'سورة البقرة • الآيات 285 - 286 • كفتاه من كل سوء',
    surahNumber: 2,
    surahName: 'البقرة',
    fromAyah: 285,
    toAyah: 286,
    reciterId: 'alafasy_128',
    reciterName: 'مشاري العفاسي',
    themeBadge: 'كنز العرش 👑',
    backgroundUrl:
      'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'royalGold',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'gentle_rain',
  },
  {
    id: 'end_kahf_107',
    category: 'endings',
    title:
      'إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ كَانَتْ لَهُمْ جَنَّاتُ الْفِرْدَوْسِ نُزُلًا',
    subtitle: 'سورة الكهف • الآيات 107 - 110 • خواتيم سورة الكهف',
    surahNumber: 18,
    surahName: 'الكهف',
    fromAyah: 107,
    toAyah: 110,
    reciterId: 'yasser_128',
    reciterName: 'ياسر الدوسري',
    themeBadge: 'جنات الفردوس 🌸',
    backgroundUrl:
      'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'emeraldNoor',
    wordHighlightColor: '#34d399',
    ambientSoundId: 'ocean_waves',
  },
  {
    id: 'end_hashr_22',
    category: 'endings',
    title: 'هُوَ اللَّهُ الَّذِي لَا إِلَهَ إِلَّا هُوَ • خواتيم الحشر',
    subtitle: 'سورة الحشر • الآيات 22 - 24 • أسماء الله الحسنى والمهابة',
    surahNumber: 59,
    surahName: 'الحشر',
    fromAyah: 22,
    toAyah: 24,
    reciterId: 'abdulbasit_murat_192',
    reciterName: 'عبد الباسط عبد الصمد',
    themeBadge: 'أسماء الله الحسنى ✨',
    backgroundUrl:
      'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'royalGold',
    wordHighlightColor: '#fbbf24',
    ambientSoundId: 'desert_wind',
  },
  {
    id: 'end_imran_190',
    category: 'endings',
    title: 'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ • أولي الألباب',
    subtitle: 'سورة آل عمران • الآيات 190 - 194 • خواتيم آل عمران',
    surahNumber: 3,
    surahName: 'آل عمران',
    fromAyah: 190,
    toAyah: 194,
    reciterId: 'maher_128',
    reciterName: 'ماهر المعيقلي',
    themeBadge: 'أولو الألباب 🌌',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    colorGrading: 'andalusianTwilight',
    wordHighlightColor: '#38bdf8',
    ambientSoundId: 'forest_stream',
  },
];
