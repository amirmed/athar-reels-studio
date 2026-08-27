import { Project, ColorGradingFilter } from '../types';

export type ClipCategory = 'azkar_daily' | 'friday_special' | 'quranic_duas' | 'virtues_occasions';

export interface ClipTemplate {
  id: string;
  title: string;
  category: ClipCategory;
  categoryLabel: string;
  categoryIcon: string;
  description: string;
  badge: string;
  surahName: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciterName: string;
  reciterId: string;
  backgroundUrl: string;
  ambientSoundId: string;
  colorGrading: ColorGradingFilter;
  aspectRatio: '9:16' | '1:1' | '16:9';
  fontFamily: string;
  wordHighlightStyle: 'goldGlow' | 'radiantWhite' | 'amberEmber' | 'emeraldGlow' | 'pillBadge';
  caption: string;
  hashtags: string[];
  estimatedDuration: string;
  contentType?: 'quran' | 'hadith' | 'azkar' | 'custom';
  customText?: string;
  customTitle?: string;
  customReference?: string;
}

export const CLIP_CATEGORIES: { id: ClipCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'جميع المقاطع (الكل)', icon: '✨' },
  { id: 'azkar_daily', label: 'أذكار الصباح والمساء', icon: '🌅' },
  { id: 'friday_special', label: 'مقاطع يوم الجمعة', icon: '🕌' },
  { id: 'quranic_duas', label: 'أدعية قرآنية خاشعة', icon: '🤲' },
  { id: 'virtues_occasions', label: 'فضائل وسور النجاة', icon: '🌙' },
];

export const READY_CLIPS_LIBRARY: ClipTemplate[] = [
  // 1. أذكار الصباح والمساء
  {
    id: 'clip-azkar-sabah-1',
    title: 'أذكار الصباح • آية الكرسي وحصن المسلم',
    category: 'azkar_daily',
    categoryLabel: 'أذكار الصباح',
    categoryIcon: '🌅',
    description:
      'مقطع ريلز مصمم للنشر الصباحي يشمل آية الكرسي كاملة بصوت عذب يبعث الطمأنينة وحفظ اليوم.',
    badge: 'ترند صباحي ☀️',
    surahName: 'البقرة',
    surahNumber: 2,
    fromAyah: 255,
    toAyah: 255,
    reciterName: 'ياسر الدوسري 🎙️',
    reciterId: 'dossari_128',
    backgroundUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'morning_birds',
    colorGrading: 'fajrBlue',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ﴾ 🌿✨\nابدأ صباحك بحصن القرآن العظيم، آية الكرسي أعظم آية في كتاب الله تحفظك حتى تمسي 🕊️',
    hashtags: [
      '#أذكار_الصباح',
      '#آية_الكرسي',
      '#قرآن',
      '#صباح_الخير',
      '#راحة_نفسية',
      '#ياسر_الدوسري',
      '#viral',
    ],
    estimatedDuration: '45 ثانية',
  },
  {
    id: 'clip-azkar-masaa-1',
    title: 'أذكار المساء • سورة الفلق والناس والإخلاص',
    category: 'azkar_daily',
    categoryLabel: 'أذكار المساء',
    categoryIcon: '🌆',
    description: 'مقطع المساء المبارك مع المعوذات الثلاث للحفظ والسكينة قبل النوم وانقضاء النهار.',
    badge: 'حصن المساء 🌙',
    surahName: 'الإخلاص',
    surahNumber: 112,
    fromAyah: 1,
    toAyah: 4,
    reciterName: 'إسلام صبحي 🎙️',
    reciterId: 'islam_sobhi',
    backgroundUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'calm_night',
    colorGrading: 'meccaGold',
    aspectRatio: '9:16',
    fontFamily: 'Cairo',
    wordHighlightStyle: 'radiantWhite',
    caption:
      '﴿قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ﴾ 🌌✨\nأذكار المساء حصنك الحصين وراحتك من وساوس الليل وتعب اليوم 🕊️',
    hashtags: [
      '#أذكار_المساء',
      '#سورة_الإخلاص',
      '#إسلام_صبحي',
      '#طمأنينة',
      '#مساء_الخير',
      '#quran',
    ],
    estimatedDuration: '30 ثانية',
  },
  {
    id: 'clip-sayyid-istighfar',
    title: 'سيد الاستغفار • توبة ومغفرة تمحو الذنوب',
    category: 'azkar_daily',
    categoryLabel: 'أذكار واستغفار',
    categoryIcon: '📿',
    description: 'سيد الاستغفار مع التشكيل الكامل، من قاله موقناً به ومات دخل الجنة.',
    badge: 'مغفرة الذنوب 🌟',
    surahName: 'نوح',
    surahNumber: 71,
    fromAyah: 10,
    toAyah: 12,
    reciterName: 'شريف مصطفى 🎙️',
    reciterId: 'sherif_mossad',
    backgroundUrl:
      'https://images.pexels.com/photos/1529881/pexels-photo-1529881.jpeg?auto=compress&cs=tinysrgb&w=1280',
    ambientSoundId: 'gentle_rain',
    colorGrading: 'emeraldGreen',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'emeraldGlow',
    caption:
      '﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا﴾ 🌧️🤲\nاللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك وأنا على عهدك ووعدك ما استطعت ✨',
    hashtags: ['#سيد_الاستغفار', '#استغفار', '#توبة', '#قرآن', '#شريف_مصطفى', '#دعاء'],
    estimatedDuration: '38 ثانية',
  },

  // 2. مقاطع يوم الجمعة
  {
    id: 'clip-friday-kahf-first',
    title: 'سورة الكهف (1 - 10) • نور ما بين الجمعتين',
    category: 'friday_special',
    categoryLabel: 'يوم الجمعة',
    categoryIcon: '🕌',
    description: 'أوائل سورة الكهف العشر آيات التي تعصم من فتنة الدجال، تلاوة يوم الجمعة المباركة.',
    badge: 'عصمة من الدجال 🛡️',
    surahName: 'الكهف',
    surahNumber: 18,
    fromAyah: 1,
    toAyah: 10,
    reciterName: 'ياسر الدوسري 🎙️',
    reciterId: 'dossari_128',
    backgroundUrl:
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'desert_wind',
    colorGrading: 'meccaGold',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا﴾ 🕌✨\nنور ما بين الجمعتين وسكينة تنزل على القلوب 🌿 لا تنس قراءة سورة الكهف اليوم!',
    hashtags: [
      '#سورة_الكهف',
      '#جمعة_مباركة',
      '#يوم_الجمعة',
      '#الكهف_نور_الجمعتين',
      '#ياسر_الدوسري',
      '#viral',
    ],
    estimatedDuration: '75 ثانية',
  },
  {
    id: 'clip-friday-salat-nabi',
    title: 'الصلاة على النبي ﷺ • إن الله وملائكته يصلون على النبي',
    category: 'friday_special',
    categoryLabel: 'يوم الجمعة',
    categoryIcon: '💚',
    description:
      'آية الأمر بالصلاة على الحبيب المصطفى ﷺ يوم الجمعة مع تذكير ساعة الاستجابة المباركة.',
    badge: 'شفاعة الحبيب ﷺ ❤️',
    surahName: 'الأحزاب',
    surahNumber: 33,
    fromAyah: 56,
    toAyah: 56,
    reciterName: 'عبد الرحمن السديس 🎙️',
    reciterId: 'sudais',
    backgroundUrl:
      'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'gentle_rain',
    colorGrading: 'madinaAmber',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'amberEmber',
    caption:
      '﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾ ﷺ 🕊️✨\nأكثروا من الصلاة على نبيكم في هذا اليوم الأغر 💚',
    hashtags: [
      '#الصلاة_على_النبي',
      '#اللهم_صل_وسلم_على_نبينا_محمد',
      '#جمعة_مباركة',
      '#ساعة_استجابة',
      '#قرآن',
    ],
    estimatedDuration: '28 ثانية',
  },
  {
    id: 'clip-friday-kahf-last',
    title: 'خواتيم سورة الكهف (107 - 110) • جنات الفردوس نزلاً',
    category: 'friday_special',
    categoryLabel: 'يوم الجمعة',
    categoryIcon: '🌿',
    description:
      'خواتيم سورة الكهف المؤثرة مع آية «قُل لَّوْ كَانَ الْبَحْرُ مِدَادًا لِّكَلِمَاتِ رَبِّي».',
    badge: 'بشارة الجنة 🌸',
    surahName: 'الكهف',
    surahNumber: 18,
    fromAyah: 107,
    toAyah: 110,
    reciterName: 'شريف مصطفى 🎙️',
    reciterId: 'sherif_mossad',
    backgroundUrl:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'ocean_waves',
    colorGrading: 'vintageWarm',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ كَانَتْ لَهُمْ جَنَّاتُ الْفِرْدَوْسِ نُزُلًا﴾ 🌿✨\nخواتيم الكهف تروي عطش الأرواح وتذكرنا بعظمة الخالق جل وعلا 🕊️',
    hashtags: ['#سورة_الكهف', '#خواتيم_الكهف', '#شريف_مصطفى', '#جمعة_طيبة', '#تلاوة_خاشعة'],
    estimatedDuration: '52 ثانية',
  },

  // 3. أدعية قرآنية خاشعة ومؤثرة
  {
    id: 'clip-dua-walidayn',
    title: 'دعاء بر الوالدين • رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    category: 'quranic_duas',
    categoryLabel: 'أدعية قرآنية',
    categoryIcon: '🤲',
    description: 'أعظم دعاء قرآني للوالدين الأحياء منهم والأموات، صدقة جارية ولمسة وفاء وبر.',
    badge: 'صدقة وبر 🤍',
    surahName: 'الإسراء',
    surahNumber: 17,
    fromAyah: 23,
    toAyah: 24,
    reciterName: 'إسلام صبحي 🎙️',
    reciterId: 'islam_sobhi',
    backgroundUrl:
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'gentle_rain',
    colorGrading: 'royalNight',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا﴾ 🤲🤍\nاللهم اغفر لوالدينا وارحمهم وتجاوز عنهم واجعل قبورهم روضة من رياض الجنة ✨',
    hashtags: [
      '#دعاء_الوالدين',
      '#بر_الوالدين',
      '#أمي',
      '#أبي',
      '#صدقة_جارية',
      '#إسلام_صبحي',
      '#قرآن',
    ],
    estimatedDuration: '40 ثانية',
  },
  {
    id: 'clip-dua-yunus-relief',
    title: 'دعاء ذي النون • لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ',
    category: 'quranic_duas',
    categoryLabel: 'أدعية قرآنية',
    categoryIcon: '🌊',
    description: 'مفتاح تفريج الكروب والهموم، لم يدعُ بها مسلم قط في شيء إلا استجاب الله له.',
    badge: 'تفريج الهموم ⚡',
    surahName: 'الأنبياء',
    surahNumber: 21,
    fromAyah: 87,
    toAyah: 88,
    reciterName: 'ياسر الدوسري 🎙️',
    reciterId: 'dossari_128',
    backgroundUrl:
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'ocean_waves',
    colorGrading: 'fajrBlue',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿فَنَادَىٰ فِي الظُّلُمَاتِ أَن لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ ۝ فَاسْتَجَبْنَا لَهُ وَنَجَّيْنَاهُ مِنَ الْغَمِّ﴾ 🌊🤲\nفرّج الله هم كل مهموم وكرب كل مكروب ✨',
    hashtags: [
      '#دعاء_الكرب',
      '#لا_إله_إلا_أنت_سبحانك',
      '#تفريج_الهموم',
      '#ياسر_الدوسري',
      '#راحة_بال',
    ],
    estimatedDuration: '42 ثانية',
  },
  {
    id: 'clip-dua-thabat-hidayah',
    title: 'دعاء الثبات والهداية • رَبَّنَا لَا تُزِغْ قُلُوبَنَا',
    category: 'quranic_duas',
    categoryLabel: 'أدعية قرآنية',
    categoryIcon: '🌟',
    description: 'دعاء الراسخين في العلم لطلب الثبات على الصراط المستقيم والرحمة الإلهية.',
    badge: 'ثبات القلب 💫',
    surahName: 'آل عمران',
    surahNumber: 3,
    fromAyah: 8,
    toAyah: 9,
    reciterName: 'شريف مصطفى 🎙️',
    reciterId: 'sherif_mossad',
    backgroundUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'calm_night',
    colorGrading: 'meccaGold',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'radiantWhite',
    caption:
      '﴿رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ﴾ 🤲✨\nيا مقلب القلوب ثبت قلوبنا على دينك وطاعتك 🕊️',
    hashtags: ['#دعاء_الثبات', '#آل_عمران', '#شريف_مصطفى', '#أدعية_قرآنية', '#هداية'],
    estimatedDuration: '36 ثانية',
  },

  // 4. فضائل وسور النجاة
  {
    id: 'clip-mulk-munjiya',
    title: 'سورة الملك (1 - 5) • تبارك الذي بيده الملك المنجية',
    category: 'virtues_occasions',
    categoryLabel: 'فضائل وسور',
    categoryIcon: '👑',
    description: 'أوائل سورة الملك الشافعة لصاحبها والمانعة من عذاب القبر قبل النوم.',
    badge: 'المنجية من عذاب القبر 🛡️',
    surahName: 'الملك',
    surahNumber: 67,
    fromAyah: 1,
    toAyah: 5,
    reciterName: 'ياسر الدوسري 🎙️',
    reciterId: 'dossari_128',
    backgroundUrl:
      'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'calm_night',
    colorGrading: 'royalNight',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ﴾ 🌌👑\nسورة الملك شفيعة لقارئها حتى يغفر له، لا تنم قبل أن تستمع إليها وتتدبرها 🕊️',
    hashtags: [
      '#سورة_الملك',
      '#المنجية_من_عذاب_القبر',
      '#ياسر_الدوسري',
      '#قبل_النوم',
      '#تلاوة_خاشعة',
    ],
    estimatedDuration: '55 ثانية',
  },
  {
    id: 'clip-quran-fajr',
    title: 'قرآن الفجر • إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا',
    category: 'virtues_occasions',
    categoryLabel: 'فضائل وسور',
    categoryIcon: '🌅',
    description: 'آيات فضل صلاة الفجر وقراءة القرآن المشهودة بحضور ملائكة الليل والنهار.',
    badge: 'مشهود بالملائكة 🕊️',
    surahName: 'الإسراء',
    surahNumber: 17,
    fromAyah: 78,
    toAyah: 80,
    reciterName: 'إسلام صبحي 🎙️',
    reciterId: 'islam_sobhi',
    backgroundUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'morning_birds',
    colorGrading: 'fajrBlue',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'radiantWhite',
    caption:
      '﴿أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾ 🌅✨\nاللهم اجعلنا من أهل الفجر وخاصتك 🤲',
    hashtags: ['#قرآن_الفجر', '#صلاة_الفجر', '#الفجر', '#إسلام_صبحي', '#بركة_الصباح'],
    estimatedDuration: '48 ثانية',
  },
  {
    id: 'clip-qiyam-layl-tranquil',
    title: 'قيام الليل والأنس بالله • تَتَجَافَىٰ جُنُوبُهُمْ عَنِ الْمَضَاجِعِ',
    category: 'virtues_occasions',
    categoryLabel: 'فضائل وسور',
    categoryIcon: '🌌',
    description: 'آيات وصف عباد الرحمن القائمين في ظلمة الليل يدعون ربهم خوفاً وطمعاً.',
    badge: 'أنس المستغفرين 💫',
    surahName: 'السجدة',
    surahNumber: 32,
    fromAyah: 15,
    toAyah: 17,
    reciterName: 'شريف مصطفى 🎙️',
    reciterId: 'sherif_mossad',
    backgroundUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=85',
    ambientSoundId: 'desert_wind',
    colorGrading: 'meccaGold',
    aspectRatio: '9:16',
    fontFamily: 'Amiri',
    wordHighlightStyle: 'goldGlow',
    caption:
      '﴿تَتَجَافَىٰ جُنُوبُهُمْ عَنِ الْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا﴾ 🌌🕊️\nركعة في ظلمات الليل تصنع المعجزات وتفتح أبواب السماء ✨',
    hashtags: ['#قيام_الليل', '#الوتر', '#شريف_مصطفى', '#سورة_السجدة', '#استغفار_الأسحار'],
    estimatedDuration: '50 ثانية',
  },
];

/**
 * Build a ready-to-render Project from any ClipTemplate
 */
export function buildProjectFromClipTemplate(clip: ClipTemplate): Project {
  return {
    id: `clip-proj-${Date.now()}`,
    name: clip.title,
    reciter: clip.reciterName,
    reciterId: clip.reciterId,
    surah: clip.surahName,
    surahNumber: clip.surahNumber,
    fromAyah: clip.fromAyah,
    toAyah: clip.toAyah,
    aspectRatio: clip.aspectRatio,
    backgroundType: 'image',
    backgroundUrl: clip.backgroundUrl,
    backgroundOpacity: 0.85,
    watermark: 'atar-studio.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'editing',
    exportCount: 0,
    translationEnabled: false,
    tafsirEnabled: false,
    caption: clip.caption,
    hashtags: clip.hashtags,
    contentType: clip.contentType || 'quran',
    customText: clip.customText,
    customTitle: clip.customTitle,
    customReference: clip.customReference,
    audioSettings: {
      recitationVolume: 90,
      fadeIn: true,
      fadeOut: true,
      fadeDuration: 1.5,
      backgroundVolume: 22,
      ambientSoundId: 'none',
      ambientSoundVolume: 25,
    },
    textSettings: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      textColor: '#ffffff',
      bgColor: '#000000',
      bgOpacity: 0.45,
      position: 'center',
      translationFontSize: 13,
      translationColor: '#e2e8f0',
      translationLanguage: 'en',
      fontFamily: clip.fontFamily,
      displayMode: 'chunked',
      wordHighlightEnabled: true,
      wordHighlightStyle: clip.wordHighlightStyle,
      wordHighlightColor: '#fbbf24',
      showWaveform: true,
      waveformStyle: 'bars',
      waveformColor: '#fbbf24',
      colorGrading: clip.colorGrading,
    },
  };
}
